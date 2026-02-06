package com.busmanagement.BusManagementSystem.dto;

import lombok.Data;

@Data
public class PassengerDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String address;
}