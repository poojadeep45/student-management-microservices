package com.example.course_service.client;

import com.example.course_service.dto.StudentDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// "student-service" is the Eureka application name — Feign + Eureka
// resolve this to wherever Student Service is actually running,
// no hardcoded host/port.
@FeignClient(name = "student-service")
public interface StudentClient {

    // Matches your real endpoint: class-level @RequestMapping("/all")
    // + method-level @GetMapping("/students/fetch/{id}")
    @GetMapping("/students/fetch/{id}")
    StudentDto getStudentById(@PathVariable("id") Long id);
}
