package com.coffeeshop.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("WebSocket connection established: session id={}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        log.info("WebSocket connection closed: session id={}, status={}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket transport error for session id={}", session.getId(), exception);
        sessions.remove(session);
    }

    /**
     * Broadcasts an event to all connected WebSocket clients.
     */
    public void broadcast(String eventType, Object data) {
        if (sessions.isEmpty()) {
            return;
        }

        try {
            Map<String, Object> message = Map.of(
                    "type", eventType,
                    "data", data != null ? data : Map.of(),
                    "timestamp", System.currentTimeMillis()
            );
            String jsonMessage = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(jsonMessage);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    synchronized (session) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (IOException e) {
                            log.warn("Failed to send WebSocket message to session id={}", session.getId(), e);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting WebSocket message of type={}", eventType, e);
        }
    }
}
