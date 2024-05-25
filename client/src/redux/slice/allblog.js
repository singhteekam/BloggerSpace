import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

// Action
export const fetchAllBlog= createAsyncThunk("fetchAllBlog", async ()=>{
    const response = await axios.get("/api/blogs");
    return response.data;
})

const allblogSlice= createSlice({
    name:"allblog",
    initialState:{
        isLoading:false,
        data:[],
        isError:false
    },
    extraReducers:(builder)=>{
        builder.addCase(fetchAllBlog.pending, (state, action)=>{
            state.isLoading=true;
        })
        builder.addCase(fetchAllBlog.fulfilled, (state, action)=>{
            state.isLoading=false;
            state.data= action.payload;
        })
        builder.addCase(fetchAllBlog.rejected, (state, action)=>{
            state.isError=true;
            console.log("Error:", action.payload);
        })
    }
});

export default allblogSlice.reducer;

