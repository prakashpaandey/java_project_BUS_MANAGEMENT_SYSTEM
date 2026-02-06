package com.busmanagement.BusManagementSystem.dto;

import lombok.Data;

@Data
public class BookingDTO {
    private Long passengerId;
    private Long scheduleId;
    private Integer numberOfSeats;
    private String seatNumbers;
    private String paymentStatus;
}