package org.acme.resources;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dtos.cases.CaseResponse;
import org.acme.dtos.cases.AcknowledgeCaseRequest;
import org.acme.dtos.cases.RegularCaseCreateRequest;
import org.acme.dtos.cases.SosCaseCreateRequest;
import org.acme.dtos.cases.UpdateCaseRequest;
import org.acme.models.Case;
import org.acme.services.CaseService;
import org.acme.websockets.CaseWebSocketEndpoint;

import java.util.List;
import java.util.stream.Collectors;

@Path("/cases")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CaseResource {

    @Inject
    CaseService caseService;

    @Inject
    CaseWebSocketEndpoint webSocketEndpoint;

    @GET
    @RolesAllowed({"ADMIN", "HOSPITAL"})
    public Response getAllCases() {
        List<Case> cases = caseService.getAllCases();
        List<CaseResponse> responses = cases.stream()
                .map(CaseResponse::fromEntity)
                .collect(Collectors.toList());
        return Response.ok(responses).build();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "HOSPITAL"})
    public Response getCaseById(@PathParam("id") Long id) {
        Case caseEntity = caseService.getCaseById(id);
        return Response.ok(CaseResponse.fromEntity(caseEntity)).build();
    }

    @POST
    @Path("/sos")
    @RolesAllowed({"VEHICLE"})
    public Response createSosCase(@Valid SosCaseCreateRequest request, @HeaderParam("userId") Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("userId header is required")
                    .build();
        }

        Case createdCase = caseService.createSosCase(request, userId);

        webSocketEndpoint.broadcastCaseUpdate(CaseResponse.fromEntity(createdCase), "CREATE");

        return Response.status(Response.Status.CREATED)
                .entity(CaseResponse.fromEntity(createdCase))
                .build();
    }

    @POST
    @Path("/regular")
    @RolesAllowed({"VEHICLE"})
    public Response createRegularCase(@Valid RegularCaseCreateRequest request, @HeaderParam("userId") Long userId) {
        if (userId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("userId header is required")
                    .build();
        }

        Case createdCase = caseService.createRegularCase(request, userId);

        webSocketEndpoint.broadcastCaseUpdate(CaseResponse.fromEntity(createdCase), "CREATE");

        return Response.status(Response.Status.CREATED)
                .entity(CaseResponse.fromEntity(createdCase))
                .build();
    }
    
    @PUT
    @Path("/{id}/acknowledge")
    @RolesAllowed({"HOSPITAL"})
    public Response acknowledgeCase(@PathParam("id") Long id, @Valid AcknowledgeCaseRequest request) {
        Case caseEntity = caseService.acknowledgeCase(id, request);

        webSocketEndpoint.broadcastCaseUpdate(CaseResponse.fromEntity(caseEntity), "ACKNOWLEDGE");

        return Response.ok(CaseResponse.fromEntity(caseEntity)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"VEHICLE", "ADMIN"})
    public Response updateCase(@PathParam("id") Long id, @Valid UpdateCaseRequest request) {
        Case caseEntity = caseService.updateCase(id, request);

        webSocketEndpoint.broadcastCaseUpdate(CaseResponse.fromEntity(caseEntity), "UPDATE");

        return Response.ok(CaseResponse.fromEntity(caseEntity)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"ADMIN"})
    public Response deleteCase(@PathParam("id") Long id) {
        caseService.deleteCase(id);
        return Response.noContent().build();
    }
}