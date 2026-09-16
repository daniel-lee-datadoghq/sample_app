package com.angularbank.api.service;

import com.angularbank.api.dto.OrderResponse;
import com.angularbank.api.dto.PlaceOrderRequest;
import com.angularbank.api.dto.PositionResponse;
import com.angularbank.api.dto.TransactionResponse;
import com.angularbank.api.model.Account;
import com.angularbank.api.model.OrderSide;
import com.angularbank.api.model.Position;
import com.angularbank.api.model.Transaction;
import com.angularbank.api.model.TransactionType;
import com.angularbank.api.repository.AccountRepository;
import com.angularbank.api.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Settles an equity order in one transaction: it moves cash on the funding account, records
 * the matching bank transaction and updates the holding.
 */
@Service
public class OrderService {

    /** Commission-free trading, kept explicit so the UI and the API agree. */
    private static final BigDecimal COMMISSION = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal MIN_NOTIONAL = new BigDecimal("0.01");

    private final AccountService accountService;
    private final PositionService positionService;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public OrderService(
            AccountService accountService,
            PositionService positionService,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository
    ) {
        this.accountService = accountService;
        this.positionService = positionService;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        Account account = accountService.getAccountById(request.getAccountId()); // verifies ownership
        OrderSide side = OrderSide.fromValue(request.getSide());
        String symbol = request.getSymbol().trim().toUpperCase();
        String currency = request.getCurrency() != null ? request.getCurrency() : account.getCurrency();

        BigDecimal quantity = request.getQuantity().setScale(PositionService.QUANTITY_SCALE, RoundingMode.DOWN);
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order quantity is too small");
        }

        BigDecimal notional = quantity.multiply(request.getPrice()).setScale(2, RoundingMode.HALF_UP);
        if (notional.compareTo(MIN_NOTIONAL) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order value is too small");
        }

        Position position;
        BigDecimal signedAmount;
        if (side == OrderSide.BUY) {
            BigDecimal cost = notional.add(COMMISSION);
            if (cost.compareTo(account.getBalance()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient buying power for this order");
            }
            position = positionService.applyBuy(account, symbol, request.getName(), currency, quantity, request.getPrice());
            signedAmount = cost.negate();
        } else {
            position = positionService.applySell(account, symbol, quantity);
            signedAmount = notional.subtract(COMMISSION);
        }

        Transaction settlement = new Transaction(
                account.getId(),
                LocalDate.now(),
                describe(side, quantity, symbol, request.getPriceType()),
                signedAmount,
                side == OrderSide.BUY ? TransactionType.DEBIT : TransactionType.CREDIT
        );
        settlement.setSymbol(symbol);
        Transaction transaction = transactionRepository.save(settlement);

        account.setBalance(account.getBalance().add(signedAmount));
        accountRepository.save(account);

        return new OrderResponse(
                confirmationNumber(transaction.getId(), symbol),
                Instant.now().toString(),
                side.getValue(),
                symbol,
                quantity,
                request.getPrice(),
                notional,
                COMMISSION,
                signedAmount.abs(),
                new TransactionResponse(transaction),
                position == null ? null : new PositionResponse(position, account)
        );
    }

    private String describe(OrderSide side, BigDecimal quantity, String symbol, String priceType) {
        return "%s %s %s @ %s".formatted(
                side.getValue().toUpperCase(),
                PositionService.trim(quantity),
                symbol,
                priceType.replace('-', ' ')
        );
    }

    private String confirmationNumber(Long transactionId, String symbol) {
        return "DD-%04d-%s".formatted(transactionId, symbol);
    }
}
