package org.acme.resources;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.acme.services.AdminService;
import org.acme.dtos.admin.CreateUserRequest;
import org.acme.dtos.admin.ChangePasswordRequest;
import org.acme.dtos.admin.UserResponse;
import org.acme.dtos.admin.UpdateUserRequest;

import java.util.List;

@Path("/admin/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)

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
        UserResponse created = adminService.createUser(request);
        return Response.status(Response.Status.CREATED)
                .entity(created)
                .build();
    }

    // DELETE /admin/users/{id}
    @DELETE
    @Path("/{id}")
    public Response deleteUser(@PathParam("id") Long id) {
        boolean deleted = adminService.deleteUser(id);

        if (!deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("User not found")
                    .build();
        }

        return Response.noContent().build();
    }

    // PUT /admin/users/{id}/password
    @PUT
    @Path("/{id}/password")
    public Response changePassword(
            @PathParam("id") Long id,
            @Valid ChangePasswordRequest request
    ) {
        adminService.changePassword(id, request);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public UserResponse updateUser(@PathParam("id") Long id, UpdateUserRequest request) {
        return adminService.updateUser(id, request);
    }


}
