import {configureStore} from "@reduxjs/toolkit";
import allblogReducer from "./slice/allblog";

export const store= configureStore({
    reducer:{
        allblog: allblogReducer,
    }
})