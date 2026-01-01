package com.fleetmanagement.kitchencrmbackend.modules.designer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "designers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Designer extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "department")
    private String department = "Design Team";

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "experience_years")
    private Integer experienceYears = 0;

    @Column(name = "hourly_rate")
    private Double hourlyRate;

    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills; // Comma-separated skills

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "max_concurrent_projects")
    private Integer maxConcurrentProjects = 5;

    @Column(name = "average_completion_days")
    private Integer averageCompletionDays = 7;

    // Helper method to get skills as array
    @Transient
    public String[] getSkillsArray() {
        if (skills == null || skills.trim().isEmpty()) {
            return new String[0];
        }
        return skills.split(",");
    }

    // Helper method to set skills from array
    @Transient
    public void setSkillsArray(String[] skillsArray) {
        if (skillsArray == null || skillsArray.length == 0) {
            this.skills = null;
        } else {
            this.skills = String.join(",", skillsArray);
        }
    }

    // Helper method to check if designer is available for new projects
    @Transient
    public boolean isAvailable() {
        return active && maxConcurrentProjects > 0;
    }
}
