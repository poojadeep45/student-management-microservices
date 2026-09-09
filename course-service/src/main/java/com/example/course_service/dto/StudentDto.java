package com.example.course_service.dto;

public class StudentDto {

    private Long studentId;
    private String studentName;
    private  String studentEmail;

    public StudentDto() {}

    public Long getStudentId() {return studentId;}
    public void setStudentId(Long studentId) {this.studentId = studentId;}

    public String getStudentName() {return studentName;}
    public void setStudentName(String studentName) {this.studentName = studentName;}

    public String getStudentEmail() {return studentEmail;}
    public void setStudentEmail(String studentEmail) {this.studentEmail = studentEmail;}
}
