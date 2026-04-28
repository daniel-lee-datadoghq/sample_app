package com.angularbank.api.service;

import com.angularbank.api.dto.AccountResponse;
import com.angularbank.api.dto.AccountSummaryResponse;
import com.angularbank.api.dto.CreateAccountRequest;
import com.angularbank.api.dto.UpdateAccountRequest;
import com.angularbank.api.model.Account;
import com.angularbank.api.model.AccountType;
import com.angularbank.api.model.User;
import com.angularbank.api.repository.AccountRepository;
import com.angularbank.api.repository.TransactionRepository;
import com.angularbank.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, TransactionRepository transactionRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findByUserId(getCurrentUserId()).stream()
                .map(AccountResponse::new)
                .toList();
    }

    public AccountResponse getAccountResponseById(Long id) {
        return new AccountResponse(getAccountById(id));
    }

    public Account getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        if (!account.getUserId().equals(getCurrentUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found");
        }
        return account;
    }

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        Account account = new Account();
        account.setUserId(getCurrentUserId());
        account.setName(request.getName());
        account.setType(AccountType.fromValue(request.getType()));
        account.setAccountNumber(request.getAccountNumber());
        account.setBalance(request.getBalance());
        account.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        return new AccountResponse(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse updateAccount(Long id, UpdateAccountRequest request) {
        Account account = getAccountById(id);
        if (request.getName() != null) account.setName(request.getName());
        if (request.getType() != null) account.setType(AccountType.fromValue(request.getType()));
        if (request.getAccountNumber() != null) account.setAccountNumber(request.getAccountNumber());
        if (request.getBalance() != null) account.setBalance(request.getBalance());
        if (request.getCurrency() != null) account.setCurrency(request.getCurrency());
        return new AccountResponse(accountRepository.save(account));
    }

    @Transactional
    public void deleteAccount(Long id) {
        Account account = getAccountById(id);
        transactionRepository.deleteByAccountId(id);
        accountRepository.delete(account);
    }

    public AccountSummaryResponse getAccountSummary() {
        Long userId = getCurrentUserId();
        List<Object[]> rows = accountRepository.getBalanceAndCountByUserId(userId);
        Object[] result = rows.get(0);
        BigDecimal totalBalance = (BigDecimal) result[0];
        long accountCount = ((Number) result[1]).longValue();
        return new AccountSummaryResponse(totalBalance, accountCount);
    }

    public List<Long> getCurrentUserAccountIds() {
        return accountRepository.findByUserId(getCurrentUserId()).stream()
                .map(Account::getId)
                .toList();
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return user.getId();
    }
}
