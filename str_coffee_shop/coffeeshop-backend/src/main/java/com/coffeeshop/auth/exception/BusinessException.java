package com.coffeeshop.auth.exception;

/**
 * Thrown for intentional, user-facing business rule violations
 * (e.g. "Username already exists"). Messages are safe to return to clients.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
