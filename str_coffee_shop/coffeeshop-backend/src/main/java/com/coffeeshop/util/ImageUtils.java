package com.coffeeshop.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class ImageUtils {

    public static String resolveImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return imageUrl;
        }

        String path = imageUrl.trim();

        // Strip legacy localhost:8080 prefixes stored in DB
        if (path.startsWith("http://localhost:8080")) {
            path = path.substring("http://localhost:8080".length());
        } else if (path.startsWith("https://localhost:8080")) {
            path = path.substring("https://localhost:8080".length());
        }

        // If it's a full external URL (e.g. Unsplash), keep as is
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();

                String scheme = request.getHeader("X-Forwarded-Proto");
                if (scheme == null || scheme.isEmpty()) {
                    scheme = request.getScheme();
                }

                String host = request.getHeader("X-Forwarded-Host");
                if (host == null || host.isEmpty()) {
                    host = request.getServerName();
                    int port = request.getServerPort();
                    if (port != 80 && port != 443 && !host.contains(":")) {
                        host = host + ":" + port;
                    }
                }

                String baseUrl = scheme + "://" + host;

                // Don't prepend localhost:8080 if running in container behind proxy
                if (!baseUrl.contains("localhost:8080") && !baseUrl.contains("127.0.0.1")) {
                    return path.startsWith("/") ? baseUrl + path : baseUrl + "/" + path;
                }
            }
        } catch (Exception ignored) {
        }

        return path.startsWith("/") ? path : "/" + path;
    }
}
