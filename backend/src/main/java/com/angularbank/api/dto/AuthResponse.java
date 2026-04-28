package com.angularbank.api.dto;

public class AuthResponse {

    private Long id;
    private String token;
    private String name;
    private String email;

    public AuthResponse(Long id, String token, String name, String email) {
        this.id = id;
        this.token = token;
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
