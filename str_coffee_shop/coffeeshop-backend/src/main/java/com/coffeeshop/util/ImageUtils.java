package com.coffeeshop.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

public class ImageUtils {

    public static String resolveImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return imageUrl;
        }

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String baseUrl = ServletUriComponentsBuilder.fromContextPath(request)
                        .build()
                        .toUriString();

                if (imageUrl.startsWith("http://localhost:8080")) {
                    return baseUrl + imageUrl.substring("http://localhost:8080".length());
                }
                if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
                    return imageUrl;
                }
                if (imageUrl.startsWith("/")) {
                    return baseUrl + imageUrl;
                }
                return baseUrl + "/" + imageUrl;
            }
        } catch (Exception ignored) {
        }

        return imageUrl;
    }
}
