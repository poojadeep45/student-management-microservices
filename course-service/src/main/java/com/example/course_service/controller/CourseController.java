package com.example.course_service.controller;

import com.example.course_service.client.StudentClient;
import com.example.course_service.dto.StudentDto;
import com.example.course_service.entity.Course;
import com.example.course_service.repository.CourseRepository;
import feign.FeignException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/courses")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentClient studentClient;

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@Valid @RequestBody Course course) {
        try {
            StudentDto student = studentClient.getStudentById(course.getEnrolledStudentId());
            System.out.println("Validated student exists: " + student.getStudentName());
        } catch (FeignException.NotFound ex) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "No student found with id " + course.getEnrolledStudentId())
            );
        } catch (FeignException ex) {
            System.out.println("FEIGN ERROR STATUS: " + ex.status());
            System.out.println("FEIGN ERROR MESSAGE: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                    Map.of("error", "Could not reach Student Service to validate student")
            );
        }
        Course saved = courseRepository.save(course);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/fetch")
    public ResponseEntity<List<Course>> fetchAllCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }
}