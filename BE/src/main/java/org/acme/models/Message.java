package org.acme.models;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message extends PanacheEntity {

    @ManyToOne()
    @JoinColumn(name="case_id", nullable=false)
    private Case caseEntity;

    @ManyToOne()
    @JoinColumn(name="sender_id", nullable=false)
    private User sender;

    @Column(nullable=false)
    private String content;

    @Column(name="created_at", nullable=false)
    private LocalDateTime createdAt;

    public Case getCaseEntity() { return caseEntity;}
    public void setCaseEntity(Case caseEntity) { this.caseEntity = caseEntity; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
