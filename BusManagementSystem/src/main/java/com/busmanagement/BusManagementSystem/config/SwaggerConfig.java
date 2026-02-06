package com.busmanagement.BusManagementSystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI busManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Bus Management System API")
                        .description("REST API for Bus Management System")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Bus Management Team")
                                .email("support@busmanagement.com")));
    }
}