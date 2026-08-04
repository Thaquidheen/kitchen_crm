package com.fleetmanagement.kitchencrmbackend.common.exception;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = error instanceof FieldError fe ? fe.getField() : error.getObjectName();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        // Surface WHICH field failed and why. Returning a bare "Validation failed" left the
        // caller with nothing actionable even though we had the detail in hand.
        String summary = errors.isEmpty()
                ? "Validation failed"
                : String.join(", ", errors.values());
        ApiResponse<Map<String, String>> body = ApiResponse.error(summary);
        body.setData(errors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<String>> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
    }

    /**
     * A record still referenced by another table. Without this it fell through to the
     * generic 500 below, which hid the cause from the UI and left the user with a bare
     * "Failed to load resource: 500" — see the quotation_folders case fixed in V90.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        logger.error("Data integrity violation: {}", ex.getMostSpecificCause().getMessage(), ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(
                        "This record is still linked to other data and could not be changed. "
                                + "Remove the linked records first, then try again."));
    }

    /**
     * A @PreAuthorize check refused the call. AuthorizationDeniedException extends
     * RuntimeException, so without this it fell through to the generic 500 below and the user
     * was told "An error occurred while processing your request" — which reads as a broken
     * save rather than a permissions problem, and sent us hunting for a bug that did not exist.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<String>> handleAccessDenied(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(
                        "You do not have permission to do this. This action is restricted to "
                                + "administrators — sign in with an administrator account and try again."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<String>> handleRuntimeException(RuntimeException ex) {
        // Log the actual error for debugging, but don't expose it to the client
        logger.error("Runtime exception occurred: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An error occurred while processing your request"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleGenericException(Exception ex) {
        // Log the actual error for debugging, but don't expose it to the client
        logger.error("Unexpected exception occurred: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}