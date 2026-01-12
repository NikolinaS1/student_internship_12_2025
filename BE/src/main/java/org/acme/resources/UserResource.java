package org.acme.resources;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dtos.UserLogin;
import org.acme.enums.Role;
import org.acme.models.User;
import org.acme.services.UserService;

import java.util.Map;

@Path("/user")
public class UserResource {

    @Inject
    UserService userService;

    @POST
    @Path("login/")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(UserLogin login) {
        User user = userService.login(login);
        if(user == null){
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid credentials"))
                    .build();
        }
        return Response.ok(user).build();
    }

    @POST
    @Path("logout/")
    @Produces(MediaType.APPLICATION_JSON)
    public Response logout() {
        return Response.ok(Map.of("message", "Logged out successfully")).build();
    }

    @GET
    @Path("{id}/")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserById(@PathParam("id") Long id) {
        User user = userService.getUserDetails(id);;
        if (user == null) {
            return Response
                    .status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "User not found"))
                    .build();
        }
        return Response.ok(user).build();
    }
}
