package com.coffeeshop.table.service;

import com.coffeeshop.table.dto.CreateTableRequest;
import com.coffeeshop.table.dto.TableDTO;

import java.util.List;

public interface TableService {
    List<TableDTO> getAllTables();
    TableDTO createTable(CreateTableRequest request);
    void deleteTable(Long id);
    TableDTO updateTableStatus(Long id, String status);
}
