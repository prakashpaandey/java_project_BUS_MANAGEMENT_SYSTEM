package com.busmanagement.BusManagementSystem.dto;

import lombok.Data;

@Data
public class BusDTO {
    private String busNumber;
    private String busType;
    private Integer totalSeats;
    private Double farePerKm;
    private Boolean isAvailable;
    private String currentLocation;
}