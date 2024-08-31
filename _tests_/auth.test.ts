import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";
import User from "../src/models/userModel";


jest.setTimeout(120000);
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI!);
    }
    // await User.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Auth Api", () => {
  let token: string;

  it("should register a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "test",
      email: "CkZ5H@example.com",
      password: "test123",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User created successfully");
  }, 30000);

  it("should not register a user with an existing email", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "test",
      email: "CkZ5H@example.com",
      password: "test123",
    });
    console.log(response.body);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User already exists");
  }, 30000);


  it("should not register a user without credentials", async () => {
    const response = await request(app).post("/api/auth/register").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All fields are required");
  }, 30000);
  
  it("should login a user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "CkZ5H@example.com",
      password: "test123",
    });

    expect(response.status).toBe(200);
    token = response.body.token;
  }, 30000);

  it("should not login a user with wrong credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "CkZ5H@example.com",
      password: "test1234",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  }, 30000);

  it("should not login a user without credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All fields are required");
  }, 30000);

});
