package org.acme.resources;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.annotation.security.RolesAllowed;

import org.acme.exeptions.ConflictException;
import org.acme.services.AdminService;
import org.acme.dtos.admin.CreateUserRequest;
import org.acme.dtos.admin.ChangePasswordRequest;
import org.acme.dtos.admin.UserResponse;
import org.acme.dtos.admin.UpdateUserRequest;

import java.util.List;
import java.util.Map;

@Path("/admin/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
//@RolesAllowed("ADMIN")

public class AdminResource {

    @Inject
    AdminService adminService;

    // GET /admin/users
    @GET
    public List<UserResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    // POST /admin/users
    @POST
    public Response createUser(@Valid CreateUserRequest request) {
        try {
            UserResponse created = adminService.createUser(request);
            return Response.status(Response.Status.CREATED)
                .entity(created)
                .build();
        }
        catch (ConflictException e){
            return Response.status(Response.Status.CONFLICT)
                    .entity(Map.of("error", e.toString()))
                    .build();
        }
    }

    // DELETE /admin/users/{id}
    @DELETE
    @Path("/{id}")
    public Response deleteUser(@PathParam("id") Long id) {
        try {
            adminService.deleteUser(id);
            return Response.noContent().build(); // 204 if deleted successfully
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build(); // 404 if user not found
        }
    }

    // PUT /admin/users/{id}/password
    @PUT
    @Path("/{id}/password")
    public Response changePassword(
            @PathParam("id") Long id,
            @Valid ChangePasswordRequest request
    ) {
        try {
            adminService.changePassword(id, request);
            return Response.noContent().build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response updateUser(@PathParam("id") Long id, @Valid UpdateUserRequest request) {

        try {
            UserResponse updated = adminService.updateUser(id, request);
            return Response.ok(updated).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }


}
