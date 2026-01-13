package org.acme.admin;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
class AdminResourceTest {

    @Test
    void createUpdateAndDeleteUser() {


        int userId =
                given()
                        .contentType("application/json")
                        .body("""
                {
                  "username": "test_user_1",
                  "password": "password123",
                  "role": "HOSPITAL"
                }
                """)
                        .when()
                        .post("/admin/users")
                        .then()
                        .statusCode(201)
                        .body("username", is("test_user_1"))
                        .body("role", is("HOSPITAL"))
                        .extract()
                        .path("id"); // assuming response has 'id' field


        given()
                .contentType("application/json")
                .body("""
                {
                  "password": "newPassword456"
                }
                """)
                .when()
                .put("/admin/users/{id}/password", userId)
                .then()
                .statusCode(204); // No Content on success


        given()
                .contentType("application/json")
                .body("""
                {
                  "username": "test_user_1_updated",
                  "role": "VEHICLE"
                }
                """)
                .when()
                .put("/admin/users/{id}", userId)
                .then()
                .statusCode(200)
                .body("username", is("test_user_1_updated"))
                .body("role", is("VEHICLE"));


        given()
                .when()
                .get("/admin/users/{id}", userId)
                .then()
                .statusCode(200)
                .body("username", is("test_user_1_updated"))
                .body("role", is("VEHICLE"));


        given()
                .when()
                .delete("/admin/users/{id}", userId)
                .then()
                .statusCode(204);


        given()
                .when()
                .get("/admin/users/{id}", userId)
                .then()
                .statusCode(404);
    }
}
