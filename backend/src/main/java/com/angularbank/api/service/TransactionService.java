package com.angularbank.api.service;

import com.angularbank.api.dto.CreateTransactionRequest;
import com.angularbank.api.dto.TransactionResponse;
import com.angularbank.api.model.Account;
import com.angularbank.api.model.Transaction;
import com.angularbank.api.model.TransactionType;
import com.angularbank.api.repository.AccountRepository;
import com.angularbank.api.repository.TransactionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;

    public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository, AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.accountService = accountService;
    }

    public List<TransactionResponse> getRecentTransactions(int limit) {
        int cappedLimit = Math.min(Math.max(limit, 1), 100);
        List<Long> userAccountIds = accountService.getCurrentUserAccountIds();
        if (userAccountIds.isEmpty()) {
            return List.of();
        }
        return transactionRepository.findByAccountIdInOrderByDateDesc(userAccountIds, PageRequest.of(0, cappedLimit)).stream()
                .map(TransactionResponse::new)
                .toList();
    }

    public List<TransactionResponse> getTransactionsByAccount(Long accountId) {
        accountService.getAccountById(accountId); // verifies ownership
        return transactionRepository.findByAccountIdOrderByDateDesc(accountId).stream()
                .map(TransactionResponse::new)
                .toList();
    }

    @Transactional
    public TransactionResponse createTransaction(CreateTransactionRequest request) {
        Account account = accountService.getAccountById(request.getAccountId());

        TransactionType txnType = TransactionType.fromValue(request.getType());
        BigDecimal signedAmount = txnType == TransactionType.DEBIT
                ? request.getAmount().negate()
                : request.getAmount();

        Transaction transaction = new Transaction();
        transaction.setAccountId(request.getAccountId());
        transaction.setDate(LocalDate.now());
        transaction.setDescription(request.getDescription());
        transaction.setAmount(signedAmount);
        transaction.setType(txnType);

        Transaction saved = transactionRepository.save(transaction);

        account.setBalance(account.getBalance().add(signedAmount));
        accountRepository.save(account);

        return new TransactionResponse(saved);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        Account account = accountService.getAccountById(transaction.getAccountId());

        account.setBalance(account.getBalance().subtract(transaction.getAmount()));
        accountRepository.save(account);

        transactionRepository.deleteById(id);
    }
}
