import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { addAlert } from "../Alert/AlertSlice";
// import store from "../../app/store";
import uniqid from "uniqid";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface userInterface {
  name: string;
  email: string;
  userId: string;
  status: "idle" | "loading" | "error" | "success";
  error: string;
  exp: number;
}

interface customJwtPayload extends JwtPayload {
  name: string;
  email: string;
  userId: string;
  exp: number;
}

const initialState: userInterface = {
  name: "",
  email: "",
  userId: "",
  status: "idle",
  error: "",
  exp: 0,
};

export const postCreateNewUser = createAsyncThunk<
  { message: string },
  { user: string; email: string; userId: string },
  { rejectValue: string }
>("UserSlice/postCreateNewUser", async (obj, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(`http://localhost:5500/api/v1/auth/signup`, {
      method: "POST",
      body: JSON.stringify(obj),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const dataRes = await res.json();

    if (!res.ok) {
      throw new Error(dataRes.message);
    }
    dispatch(
      addAlert({
        message: dataRes.message,
        color: "green",
        alertId: uniqid(),
      })
    );
    return dataRes; // Pass the successful response to the fulfilled case
  } catch (err: unknown) {
    const mssg = err instanceof Error ? err.message : "unknown Error";

    dispatch(
      addAlert({
        message: mssg,
        color: "red",
        alertId: uniqid(),
      })
    );
    return rejectWithValue(mssg);
  }
});

export const postUserLogin = createAsyncThunk<
  { message: string; token?: string },
  { email: string; password: string },
  { rejectValue: string }
>("POST/userLogin", async (obj, { dispatch, rejectWithValue }) => {
  try {
    const res = await fetch(`http://localhost:5500/api/v1/auth/login`, {
      method: "POST",
      body: JSON.stringify(obj),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const dataRes = await res.json();

    if (!res.ok) {
      throw new Error(dataRes.message);
    }
    dispatch(
      addAlert({ message: dataRes.message, color: "green", alertId: uniqid() })
    );
    return dataRes;
  } catch (err: unknown) {
    const mssg = err instanceof Error ? err.message : "unknown error";
    dispatch(addAlert({ message: mssg, color: "red", alertId: uniqid() }));
    return rejectWithValue(mssg);
  }
});

// Redux slice
const UserSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    setUserLoginCredential: (
      state,
      action: PayloadAction<{ userId: string; email: string; name: string }>
    ) => {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.name = action.payload.name;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postCreateNewUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(
        postCreateNewUser.fulfilled,
        (state, action: PayloadAction<{ message: string }>) => {
          state.status = "success";
          state.error = "";
        }
      )
      .addCase(
        postCreateNewUser.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.status = "error";
          state.error =
            action.payload || action.error?.message || "An error occurred";
        }
      );

    builder
      .addCase(postUserLogin.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(
        postUserLogin.fulfilled,
        (state, action: PayloadAction<{ message: string; token: string }>) => {
          state.status = "success";
          state.error = "";
          localStorage.setItem("token", action.payload.token);
          try {
            const {
              name,
              email,
              userId,
              exp,
            }: {
              name: string;
              email: string;
              userId: string;
              exp: number;
            } = jwtDecode<customJwtPayload>(action.payload.token);
            state.email = email;
            state.userId = userId;
            state.exp = exp;
            state.name = name;
          } catch (err: unknown) {
            const mssg: string =
              err instanceof Error ? err.message : "An error occurred";
            state.error = mssg;
          }
        }
      )
      .addCase(
        postUserLogin.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.status = "error";
          state.error =
            action.payload || action.error?.message || "An error occurred";
        }
      );
  },
});

export const { setUserLoginCredential } = UserSlice.actions;
export default UserSlice;