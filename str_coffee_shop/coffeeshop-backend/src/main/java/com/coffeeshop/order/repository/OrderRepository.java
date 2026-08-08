package com.coffeeshop.order.repository;

import com.coffeeshop.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatusNotOrderByCreatedAtDesc(String status);
    List<Order> findByStatusNotInOrderByCreatedAtDesc(Collection<String> statuses);
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByTableNumberAndStatusNot(Integer tableNumber, String status);
    List<Order> findByTableNumberAndStatusNotIn(Integer tableNumber, Collection<String> statuses);
    Optional<Order> findFirstByTableNumberAndStatusNotOrderByCreatedAtAsc(Integer tableNumber, String status);
}
