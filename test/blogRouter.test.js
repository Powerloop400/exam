const supertest = require("supertest");
const app = require("../app");

let authToken = null; 

beforeAll(async () => {
  try {
    const response = await supertest(app)
      .post("/login")
      .send({ username: "mabdurrahman.balogun", password: "pass.word123" });
    authToken = response.headers["set-cookie"][0].split(";")[0].split("=")[1];
  } catch (error) {
    console.error("Error during login:", error);
    throw error; 
  }
});

describe("Book Route", () => {
  it("GET /logs works", async () => {
    const response = await supertest(app).get("/books");
    expect(response.headers["content-type"]).toBe("application/json");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("GET /blogs?id works", async () => {
    const response = await supertest(app).get("/books?id=1");
    expect(response.headers["content-type"]).toBe("application/json");
    expect(response.status).toBe(200);
  });

  it("POST /blogs works", async () => {
    const bookToAdd = {
      title: "New test book",
      tags: "a book about nothing",
      description: "This is a test book",
      body: "This is a test book",
    };
    const response = await supertest(app)
      .post("/books")
      .set("Cookie", `auth_token=${authToken}`) // Set the auth token in the request
      .send(bookToAdd);
    expect(response.headers["content-type"]).toBe("application/json");
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("New test book");
    expect(response.body.tags).toBe("a book about nothing");
    expect(response.body.description).toBe("This is a test book");
  });

  it("DELETE /blogs works", async () => {
    const response = await supertest(app).delete("/books?id=5");
    expect(response.headers["content-type"]).toBe("application/json");
    expect(response.status).toBe(200);
  });
});
