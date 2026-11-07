package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import java.nio.file.Path;

/**
 * One receipt's file on disk, found from its record, with the name it was uploaded under and the
 * content type to send it back with. The type comes from the stored extension (only PDF, JPG and PNG
 * are ever accepted), never from what the uploader's browser claimed.
 */
public record FinanceReceiptContent(Path path, String fileName, String contentType) {
}
