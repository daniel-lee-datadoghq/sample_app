package com.angularbank.api.controller;

import com.angularbank.api.dto.PositionResponse;
import com.angularbank.api.service.PositionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
public class PositionController {

    private final PositionService positionService;

    public PositionController(PositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping
    public List<PositionResponse> getPositions() {
        return positionService.getPositions();
    }

    @GetMapping("/account/{accountId}")
    public List<PositionResponse> getPositionsByAccount(@PathVariable Long accountId) {
        return positionService.getPositionsByAccount(accountId);
    }
}
