import React, { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "react-query";
import $axios from "../../lib/axios.instance";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  openErrorSnackbar,
  openSuccessSnackbar,
} from "../store/slices/snackbar.slice";
import OtpVerification from "./OtpVerification";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState("");

  const { isLoading, mutate: registerUser } = useMutation({
    mutationKey: ["register-user"],
    mutationFn: async (values) => {
      // Include OTP along with registration data
      return await $axios.post("/user/register", values);
    },
    onSuccess: () => {
      setShowOtp(true); // Show OTP verification form
      dispatch(openSuccessSnackbar("OTP sent to your email address"));
    },
    onError: (error) => {
      dispatch(openErrorSnackbar(error.response.data.message));
    },
  });

  const { mutate: verifyOtp } = useMutation({
    mutationKey: ["verify-otp"],
    mutationFn: async (values) => {
      return await $axios.post("/user/verify", values); // Backend expects OTP along with registration
    },
    onSuccess: () => {
      navigate("/login");
      dispatch(openSuccessSnackbar("Email verified successfully"));
    },
    onError: (error) => {
      console.error("OTP Verification Error:", error);
      dispatch(
        openErrorSnackbar(
          error.response?.data?.message || "Something went wrong"
        )
      );
    },
  });

  return (
    <>
      {isLoading && <LinearProgress color="secondary" />}
      {!showOtp ? (
        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            gender: null,
            dob: null,
            role: "",
          }}
          validationSchema={Yup.object({
            firstName: Yup.string()
              .required("First name is required")
              .trim()
              .max(55, "First name must be at max 55 characters"),
            lastName: Yup.string()
              .required("Last name is required")
              .trim()
              .max(55, "First name must be at max 55 characters"),
            email: Yup.string()
              .email("Must be a valid email")
              .required("Email is required")
              .trim()
              .lowercase()
              .max(55, "Email must be at max 55 characters"),
            password: Yup.string()
              .required("Password is required")
              .min(8, "Password must be at least 8 characters"),
            role: Yup.string()
              .oneOf(["buyer", "seller"])
              .required("Role is required")
              .trim(),
          })}
          onSubmit={(values) => {
            setEmail(values.email); // Store email for OTP verification
            registerUser(values);
          }}
        >
          {({
            handleSubmit,
            getFieldProps,
            touched,
            errors,
            setFieldValue,
          }) => (
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                boxShadow:
                  " rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px",
                padding: "2rem",
                gap: "2rem",
                minWidth: "400px",
              }}
              onSubmit={handleSubmit}
            >
              <Typography variant="h4">Sign Up</Typography>
              <FormControl>
                <TextField
                  color="success"
                  variant="outlined"
                  label="First name"
                  error={!!touched.firstName && !!errors.firstName}
                  helperText={errors.firstName}
                  {...getFieldProps("firstName")}
                />
              </FormControl>

              <FormControl>
                <TextField
                  color="success"
                  variant="outlined"
                  label="Last name"
                  error={!!touched.lastName && !!errors.lastName}
                  helperText={errors.lastName}
                  {...getFieldProps("lastName")}
                />
              </FormControl>

              <FormControl>
                <TextField
                  color="success"
                  variant="outlined"
                  label="Email"
                  error={!!touched.email && !!errors.email}
                  helperText={errors.email}
                  {...getFieldProps("email")}
                />
              </FormControl>

              <FormControl>
                <TextField
                  color="success"
                  variant="outlined"
                  label="Password"
                  error={!!touched.password && !!errors.password}
                  helperText={errors.password}
                  {...getFieldProps("password")}
                />
              </FormControl>

              <FormControl fullWidth error={!!touched.role && !!errors.role}>
                <InputLabel id="demo-simple-select-label">Role</InputLabel>
                <Select
                  color="success"
                  {...getFieldProps("role")}
                  helperText={errors.role}
                  label="Role"
                  onChange={(event) => {
                    setFieldValue("role", event.target.value);
                  }}
                >
                  <MenuItem value="buyer">Buyer</MenuItem>
                  <MenuItem value="seller">Seller</MenuItem>
                </Select>
                <FormHelperText>{errors.role}</FormHelperText>
              </FormControl>

              <Stack spacing={1}>
                <Button
                  variant="contained"
                  type="submit"
                  color="success"
                  disableRipple
                  disabled={isLoading}
                >
                  Register
                </Button>
                <Link to="/login">
                  <Typography color="#9c27b0" variant="subtitle2">
                    Already registered? Login
                  </Typography>
                </Link>
              </Stack>
            </form>
          )}
        </Formik>
      ) : (
        <OtpVerification email={email} verifyOtp={verifyOtp} />
      )}
    </>
  );
};

export default Register;
