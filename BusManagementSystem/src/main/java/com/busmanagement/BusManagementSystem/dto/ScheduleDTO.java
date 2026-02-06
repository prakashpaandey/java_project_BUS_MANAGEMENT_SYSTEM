package com.busmanagement.BusManagementSystem.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScheduleDTO {
    private Long busId;
    private Long routeId;
    private Long driverId;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String status;
}