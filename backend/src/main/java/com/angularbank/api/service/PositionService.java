package com.angularbank.api.service;

import com.angularbank.api.dto.PositionResponse;
import com.angularbank.api.model.Account;
import com.angularbank.api.model.Position;
import com.angularbank.api.repository.AccountRepository;
import com.angularbank.api.repository.PositionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PositionService {

    static final int QUANTITY_SCALE = 5;
    private static final int COST_SCALE = 4;

    private final PositionRepository positionRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;

    public PositionService(PositionRepository positionRepository, AccountRepository accountRepository, AccountService accountService) {
        this.positionRepository = positionRepository;
        this.accountRepository = accountRepository;
        this.accountService = accountService;
    }

    public List<PositionResponse> getPositions() {
        List<Long> accountIds = accountService.getCurrentUserAccountIds();
        if (accountIds.isEmpty()) {
            return List.of();
        }
        Map<Long, Account> accounts = accountRepository.findAllById(accountIds).stream()
                .collect(Collectors.toMap(Account::getId, account -> account));
        return positionRepository.findByAccountIdInOrderBySymbolAsc(accountIds).stream()
                .map(position -> new PositionResponse(position, accounts.get(position.getAccountId())))
                .toList();
    }

    public List<PositionResponse> getPositionsByAccount(Long accountId) {
        Account account = accountService.getAccountById(accountId); // verifies ownership
        return positionRepository.findByAccountIdOrderBySymbolAsc(accountId).stream()
                .map(position -> new PositionResponse(position, account))
                .toList();
    }

    /** Adds shares at the fill price, blending the average cost. */
    @Transactional
    Position applyBuy(Account account, String symbol, String name, String currency, BigDecimal quantity, BigDecimal price) {
        Position position = positionRepository.findByAccountIdAndSymbol(account.getId(), symbol).orElse(null);
        if (position == null) {
            position = new Position();
            position.setAccountId(account.getId());
            position.setSymbol(symbol);
            position.setName(name);
            position.setCurrency(currency);
            position.setQuantity(BigDecimal.ZERO.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP));
            position.setAverageCost(BigDecimal.ZERO.setScale(COST_SCALE, RoundingMode.HALF_UP));
        }

        BigDecimal previousCost = position.getQuantity().multiply(position.getAverageCost());
        BigDecimal newQuantity = position.getQuantity().add(quantity).setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
        BigDecimal newCost = previousCost.add(quantity.multiply(price));

        position.setName(name);
        position.setQuantity(newQuantity);
        position.setAverageCost(newCost.divide(newQuantity, COST_SCALE, RoundingMode.HALF_UP));
        return positionRepository.save(position);
    }

    /**
     * Removes shares at the fill price. The average cost is left alone, so realised gains
     * stay out of the cost basis. A position sold down to zero is closed.
     */
    @Transactional
    Position applySell(Account account, String symbol, BigDecimal quantity) {
        Position position = positionRepository.findByAccountIdAndSymbol(account.getId(), symbol)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "You do not hold any " + symbol + " in this account"));

        if (position.getQuantity().compareTo(quantity) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You only hold " + trim(position.getQuantity()) + " shares of " + symbol + " in this account");
        }

        BigDecimal remaining = position.getQuantity().subtract(quantity).setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
        if (remaining.compareTo(BigDecimal.ZERO) == 0) {
            positionRepository.delete(position);
            return null;
        }

        position.setQuantity(remaining);
        return positionRepository.save(position);
    }

    static String trim(BigDecimal value) {
        BigDecimal stripped = value.stripTrailingZeros();
        return stripped.scale() < 0 ? stripped.setScale(0).toPlainString() : stripped.toPlainString();
    }
}
