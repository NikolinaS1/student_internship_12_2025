package org.acme.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import org.acme.dtos.cases.AcknowledgeCaseRequest;
import org.acme.dtos.cases.RegularCaseCreateRequest;
import org.acme.dtos.cases.SosCaseCreateRequest;
import org.acme.dtos.cases.UpdateCaseRequest;
import org.acme.enums.Priority;
import org.acme.models.Case;
import org.acme.models.User;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class CaseService {

    public List<Case> getAllCases() {
        return Case.listAll();
    }

    public Case getCaseById(Long id) {
        Case caseEntity = Case.findById(id);
        if (caseEntity == null) {
            throw new NotFoundException("Case not found");
        }
        return caseEntity;
    }

    @Transactional
    public Case createSosCase(SosCaseCreateRequest request, Long userId) {
        User user = User.findById(userId);
        if (user == null) {
            throw new NotFoundException("User not found");
        }

        Case caseEntity = new Case();
        caseEntity.setCreatedBy(user);
        caseEntity.setCreatedAt(LocalDateTime.now().withNano(0));
        caseEntity.setPatientName(request.patientName());
        caseEntity.setBirthYear(request.birthYear());
        caseEntity.setSex(request.sex());
        caseEntity.setDescription(request.description());
        caseEntity.setIsSos(true);
        caseEntity.setAcknowledged(false);
        caseEntity.setIsActive(true);
        caseEntity.setLatitude(request.latitude());
        caseEntity.setLongitude(request.longitude());
        caseEntity.setPriority(Priority.HIGH);

        caseEntity.persist();
        return caseEntity;
    }

    @Transactional
    public Case createRegularCase(RegularCaseCreateRequest request, Long userId) {
        User user = User.findById(userId);
        if (user == null) {
            throw new NotFoundException("User not found");
        }

        Case caseEntity = new Case();
        caseEntity.setCreatedBy(user);
        caseEntity.setCreatedAt(LocalDateTime.now().withNano(0));
        caseEntity.setPatientName(request.patientName());
        caseEntity.setBirthYear(request.birthYear());
        caseEntity.setSex(request.sex());
        caseEntity.setDescription(request.description());
        caseEntity.setBpm(request.bpm());
        caseEntity.setSystolicPressure(request.systolicPressure());
        caseEntity.setDiastolicPressure(request.diastolicPressure());
        caseEntity.setResRate(request.resRate());
        caseEntity.setSaturation(request.saturation());
        caseEntity.setTemperature(request.temperature());
        caseEntity.setIsSos(false);
        caseEntity.setAcknowledged(false);
        caseEntity.setIsActive(true);
        caseEntity.setLatitude(request.latitude());
        caseEntity.setLongitude(request.longitude());

        Priority priority = calculatePriority(caseEntity);
        caseEntity.setPriority(priority);

        caseEntity.persist();
        return caseEntity;
    }

    @Transactional
    public Case acknowledgeCase(Long caseId, AcknowledgeCaseRequest request) {
        Case caseEntity = Case.findById(caseId);
        if (caseEntity == null) {
            throw new NotFoundException("Case not found");
        }
        caseEntity.setAcknowledged(request.acknowledged());
        caseEntity.persist();
        return caseEntity;
    }

    @Transactional
    public Case updateCase(Long caseId, UpdateCaseRequest request) {
        Case caseEntity = Case.findById(caseId);
        if (caseEntity == null) {
            throw new NotFoundException("Case not found");
        }

        caseEntity.setPatientName(request.patientName());
        caseEntity.setBirthYear(request.birthYear());
        caseEntity.setSex(request.sex());
        caseEntity.setDescription(request.description());

        if (request.bpm() != null) {
            caseEntity.setBpm(request.bpm());
        }
        if (request.systolicPressure() != null) {
            caseEntity.setSystolicPressure(request.systolicPressure());
        }
        if (request.diastolicPressure() != null) {
            caseEntity.setDiastolicPressure(request.diastolicPressure());
        }
        if (request.resRate() != null) {
            caseEntity.setResRate(request.resRate());
        }
        if (request.saturation() != null) {
            caseEntity.setSaturation(request.saturation());
        }
        if (request.temperature() != null) {
            caseEntity.setTemperature(request.temperature());
        }

        if (!caseEntity.getIsSos()) {
            Priority newPriority = calculatePriority(caseEntity);
            caseEntity.setPriority(newPriority);
        }

        caseEntity.persist();
        return caseEntity;
    }

    @Transactional
    public void deleteCase(Long id) {
        Case caseEntity = Case.findById(id);
        if (caseEntity == null) {
            throw new NotFoundException("Case not found");
        }
        caseEntity.delete();
    }

    private Priority calculatePriority(Case caseEntity) {
        int highCount = 0;
        int mediumCount = 0;

        if (caseEntity.getBpm() != null) {
            if (caseEntity.getBpm() < 40 || caseEntity.getBpm() > 150) {
                highCount++;
            } else if (caseEntity.getBpm() < 55 || caseEntity.getBpm() > 130) {
                mediumCount++;
            }
        }

        if (caseEntity.getSystolicPressure() != null) {
            if (caseEntity.getSystolicPressure() < 90 || caseEntity.getSystolicPressure() > 180) {
                highCount++;
            } else if (caseEntity.getSystolicPressure() < 100 || caseEntity.getSystolicPressure() > 140) {
                mediumCount++;
            }
        }

        if (caseEntity.getDiastolicPressure() != null) {
            if (caseEntity.getDiastolicPressure() < 60 || caseEntity.getDiastolicPressure() > 120) {
                highCount++;
            } else if (caseEntity.getDiastolicPressure() < 70 || caseEntity.getDiastolicPressure() > 90) {
                mediumCount++;
            }
        }

        if (caseEntity.getResRate() != null) {
            if (caseEntity.getResRate() < 12 || caseEntity.getResRate() > 25) {
                highCount++;
            } else if (caseEntity.getResRate() < 14 || caseEntity.getResRate() > 20) {
                mediumCount++;
            }
        }

        if (caseEntity.getSaturation() != null) {
            if (caseEntity.getSaturation() < 90) {
                highCount++;
            } else if (caseEntity.getSaturation() < 95) {
                mediumCount++;
            }
        }

        if (caseEntity.getTemperature() != null) {
            if (caseEntity.getTemperature() < 35.0 || caseEntity.getTemperature() > 39.0) {
                highCount++;
            } else if (caseEntity.getTemperature() < 36.0 || caseEntity.getTemperature() > 38.0) {
                mediumCount++;
            }
        }

        if (highCount >= 3) {
            return Priority.HIGH;
        } else if (highCount >= 1 || mediumCount >= 3) {
            return Priority.MEDIUM;
        } else {
            return Priority.LOW;
        }
    }
}