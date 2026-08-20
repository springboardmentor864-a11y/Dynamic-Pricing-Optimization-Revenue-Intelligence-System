import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import "./DashboardLayout.css";


function DashboardLayout() {


    return (

        <div className="layout">


            <Sidebar />


            <div className="main-content">

                <Outlet />

            </div>


        </div>

    );


}


export default DashboardLayout;