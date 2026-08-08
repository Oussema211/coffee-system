package com.coffeeshop.table.service;

import com.coffeeshop.table.dto.CreateTableRequest;
import com.coffeeshop.table.dto.TableDTO;
import com.coffeeshop.table.entity.RestaurantTable;
import com.coffeeshop.table.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TableDTO> getAllTables() {
        return tableRepository.findAllByOrderByNumberAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TableDTO createTable(CreateTableRequest request) {
        if (tableRepository.existsByNumber(request.getNumber())) {
            throw new IllegalArgumentException("Table number " + request.getNumber() + " already exists");
        }
        RestaurantTable table = RestaurantTable.builder()
                .number(request.getNumber())
                .seats(request.getSeats())
                .status("Available")
                .build();
        return mapToDTO(tableRepository.save(table));
    }

    @Override
    public void deleteTable(Long id) {
        if (!tableRepository.existsById(id)) {
            throw new IllegalArgumentException("Table not found with id: " + id);
        }
        tableRepository.deleteById(id);
    }

    private TableDTO mapToDTO(RestaurantTable t) {
        return TableDTO.builder()
                .id(t.getId())
                .number(t.getNumber())
                .seats(t.getSeats())
                .status(t.getStatus())
                .build();
    }
}
