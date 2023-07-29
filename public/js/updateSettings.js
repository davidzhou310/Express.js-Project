import axios from "axios";

import { showAlert } from "./alerts";

//type is either password ot data
export const updateSettings = async (data, type) => {
    try {
        const url = type === "password" 
            ? '/api/v1/users/updateMyPassword' 
            : "/api/v1/users/updateMe";

        const res = await axios({
            method: "PATCH",
            url,
            data
        });

        if (res.data.status === "success") {
            showAlert("success", `${type} updated successfully`);
            window.setTimeout(() => {
                location.reload(true)
            }, 5000);
        }
    } catch (err) {
        showAlert("error", err.response.data.message);
    }
}