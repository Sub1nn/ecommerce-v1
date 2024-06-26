import MenuIcon from "@mui/icons-material/Menu"
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined"
import { Badge, ThemeProvider, Tooltip, createTheme } from "@mui/material"
import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CssBaseline from "@mui/material/CssBaseline"
import Divider from "@mui/material/Divider"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import * as React from "react"
import { useQuery } from "react-query"
import { useNavigate } from "react-router-dom"
import $axios from "../../lib/axios.instance"
import LogoutDialog from "./LogoutDialog"
import ThemeToggle from "./ThemeToggle"
import { useDispatch } from "react-redux"
import { clearFilter } from "../store/slices/productSlice"
import GreetingPopover from "./GreetingPopover"
import { AddToQueue } from "@mui/icons-material"

const drawerWidth = 240
const navItems = [
  {
    id: 1,
    name: "Home",
    path: "/",
  },
  {
    id: 2,
    name: "Product",
    path: "/product/list",
  },
  {
    id: 3,
    name: "About",
    path: "/about",
  },
]

const lightTheme = createTheme()
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
})

const Header = (props) => {
  const dispatch = useDispatch()
  const [theme, setTheme] = React.useState("light")
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }
  const userRole = localStorage.getItem("role")
  const navigate = useNavigate()
  const { window } = props
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // get cart count
  const { data, isLoading } = useQuery({
    queryKey: ["cart-item-count"],
    queryFn: async () => {
      return await $axios.get("/cart/item/count")
    },
    enabled: userRole === "buyer",
  })

  const cartItemCount = data?.data?.cartItemCount

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState)
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Subi Mart
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.id}
            disablePadding
            onClick={() => {
              navigate(item.path)
            }}
          >
            <ListItemButton sx={{ textAlign: "center" }}>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  const container =
    window !== undefined ? () => window().document.body : undefined

  return (
    <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar component="nav" sx={{ backgroundColor: "#5D3587" }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: "none" } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                component="div"
                onClick={() => {
                  navigate("/")
                }}
                sx={{
                  display: { xs: "block", md: "inline-block" }, // Display inline-block on medium and larger screens
                  width: { xs: "100%", md: "auto" }, // Adjust width for medium and larger screens
                  whiteSpace: "nowrap", // Prevent text from wrapping
                  cursor: "pointer",
                }}
              >
                Subi Mart
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  sx={{
                    color: "#fff",
                    display: { xs: "none", sm: "inline-block" },
                  }} // Hide on mobile, show on larger screens
                  onClick={() => {
                    navigate(item.path)
                    dispatch(clearFilter())
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {userRole === "buyer" ? (
                <IconButton
                  size="large"
                  onClick={() => {
                    navigate("/cart")
                  }}
                >
                  <Badge
                    badgeContent={cartItemCount || null}
                    color="primary"
                    sx={{ cursor: "pointer" }}
                  >
                    <ShoppingCartOutlinedIcon sx={{ color: "white" }} />
                  </Badge>
                </IconButton>
              ) : (
                <Tooltip title="Add Product" arrow>
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => {
                      navigate("/product/add")
                    }}
                  >
                    <AddToQueue />
                  </IconButton>
                </Tooltip>
              )}
              <GreetingPopover />
            </Box>
          </Toolbar>
        </AppBar>
        <nav>
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        </nav>
      </Box>
    </ThemeProvider>
  )
}

export default Header
