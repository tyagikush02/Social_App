import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithPopup ,signInWithEmailAndPassword} from "firebase/auth";
import { db,auth,googleProvider } from "../../lib/firebase";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import upload from "../../Lib/uploadFiles";


export default function Login(){

    const [avatar,setAvatar]=useState({
        file:null,
        url:""
    })

    const [loading,setLoading]=useState(false);

    const handleAvatar=e=>{
        if(e.target.files[0]){
            setAvatar({
                file:e.target.files[0],
                url:URL.createObjectURL(e.target.files[0])
            })
        }
    }


    const handleLogin= async(e) =>{
        e.preventDefault();
        setLoading(true);

        const formData=new FormData(e.target);
        const {email,password} = Object.
        fromEntries(formData);
        
        try {
            await signInWithEmailAndPassword(auth,email,password);
            toast.success("successfully done signIn and please referesh the page");
        } catch (error) {
            toast.error(error.message);
        }finally{
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
          
            await signInWithPopup(auth, googleProvider);
            toast.success("successfully done signIn and please referesh the page");

        } catch (error) {
          toast.error(error.message);
        }finally{
            setLoading(false);
        }
    };

    const handleRegister= async(e) =>{
        e.preventDefault();
        setLoading(true);
        const formData=new FormData(e.target);
        
        const {username,email,password} = Object.
        fromEntries(formData);

        // VALIDATE INPUTS
        if (!username || !email || !password)
            return toast.warn("Please enter inputs!");
        if (!avatar.file) return toast.warn("Please upload an avatar!");
    
        // VALIDATE UNIQUE USERNAME
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return toast.warn("Select another username");
        }

        try{
            const res=await createUserWithEmailAndPassword(auth,email,password);
            
            // UPLOADING THE FILE OF IMAGE
            
            const imgUrl=await upload(avatar.file); 

            await setDoc(doc(db,"users",res.user.uid),{
                username,
                email,
                avatar:imgUrl,
                id:res.user.uid,
                blocked:[],
            });

            await setDoc(doc(db,"userchats",res.user.uid),{
                chats:[],
            });
            
            toast.success("SignUp Successfully")
        }
        catch(error){
            toast.error(error.message);

            if (res.user) {
                await auth.currentUser.delete().catch(delError => {
                    console.error("Failed to delete user:", delError);
                });
            }
        }
        finally{
            setLoading(false);
        }
    }


    return(
        <div className="login">
            <div className="item">
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="Email" name="email" />

                    <input type="password" name="password" placeholder="Password" />
                    <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
                </form>
                <div className="another">
                    <button className="google" onClick={handleGoogleLogin}>{loading ? "Loading" : "Google"}</button>
                    <button className="github">{loading ? "Loading" : "Github"}</button>
                </div>
            </div>

            <div className="seperator"></div>
            
            <div className="item">
                <h2>Create An Account</h2>
                <form onSubmit={handleRegister}>

                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="" />
                        Upload an image</label>
                    <input type="file" name="file" id="file" style={{display:"none"}} onChange={handleAvatar}/>

                    <input type="text" placeholder="UserName" name="username" />
                   
                    <input type="email" placeholder="Email" name="email" />

                    <input type="password" name="password" placeholder="Password" />
                    <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
                </form>
            </div>
        </div>      
    )
}