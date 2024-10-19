import { useEffect, useRef, useState } from "react"
import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { toast } from "react-toastify";
import upload from "../../Lib/uploadFiles";
import { format } from "date-fns";

export default function Chat(){
    const [emojiMode,setEmojiMode]=useState(false); 
    const [text,setText]=useState("");
    const [chat,setChat]=useState();
    const [img,setImg]=useState({
        file:null,
        url:""
    })

    const videoRef = useRef(null);  // Reference to the video element
    const [stream, setStream] = useState(null);

    const {currentUser} =useUserStore();
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();
    
    useEffect(()=>{
        const unSub=onSnapshot(doc(db,"chats",chatId),(res)=>{
            setChat(res.data());
        })
        return () => {
            unSub();
        };
    },[chatId])

    const handleEmoji=(e)=>{
        setText((prev)=> prev + e.emoji);
        setEmojiMode(false);
    }
    
    const handleImg=(e)=>{
        if(e.target.files[0]){
            setImg({
                file:e.target.files[0],
                url:URL.createObjectURL(e.target.files[0])
            })
        }
        
    }
    const handleOpenCamera = async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop()); // Stop all video tracks
            setStream(null); // Reset stream
            return;
        }
        try {
          // Request access to the camera
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });

          setStream(mediaStream);

          // Set the stream to the video element
          if (videoRef.current) {
            console.log("Setting video stream...");
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
        } catch (error) {
          console.error("Error accessing the camera: ", error);
        }
      };
      useEffect(() => {
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, [stream]);
    const handleSend=async()=>{
        if(text==="") return ;

        let imgUrl=null;

        try{

            if(img.file){
                console.log("enter");
                imgUrl=await upload(img.file);
            }
            await updateDoc(doc(db,"chats",chatId),{
                messages:arrayUnion({
                    senderId:currentUser?.id,
                    text,
                    createdAt:new Date(),
                    ...(imgUrl && { img: imgUrl }),
                }),
            });

            const userIDs=[currentUser.id,user.id];

            userIDs.forEach(async(id)=>{
                const userChatsRef=doc(db,"userchats",id)
                const userChatsSnapshot=await getDoc(userChatsRef);

                if(userChatsSnapshot.exists()){
                    const userChatsData=userChatsSnapshot.data();

                    const chatIndex=userChatsData.chats.findIndex(c=> c.chatId === chatId)

                    userChatsData.chats[chatIndex].lastMessage=text;
                    userChatsData.chats[chatIndex].isSeen=id===currentUser.id ? true:false;
                    userChatsData.chats[chatIndex].updatedAt=Date.now();

                    await updateDoc(userChatsRef,{
                        chats:userChatsData.chats,
                    })
                }
            })
        }catch(err){
            toast(err.message);
        }
        finally{
            setImg({
              file: null,
              url: "",
            });
        
            setText("");
        }
    };

    return(
        <div className="chat">
            <div className="top">
                <div className="user">
                    <img src={user?.avatar ||"./avatar.png"} alt="" />
                    <div className="texts">
                    <span>{user?.username}</span>
                </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                    <img src="./info.png" alt="" />
                </div>
            </div>

            <div className="center">
                {chat?.messages?.map((message)=>(
                    <div className={message?.senderId === currentUser?.id ?"message own":"message"} key={message?.createdAt}>
                        <div className="texts">
                            {message.img && <img src={message.img} alt=""/>}
                            <p>{message.text}</p>
                            <span>{format(message.createdAt.toDate(),'PPpp')}</span>
                        </div>
                    </div>
                ))}
                {img.url && (
                    <div className="message own">
                        <div className="texts">
                            <img src={img.url} alt=""/>
                        </div>
                    </div>
                )}
                {stream && (
                    <div>
                    <video
                        ref={videoRef}
                        autoPlay
                        style={{
                        width: '400px',    // Explicit width
                        height: '300px',   // Explicit height
                        marginTop: '10px',
                        border: '2px solid black'
                        }}
                    />
                    </div>
                )}
            </div>

            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="" />
                    </label>
                    <input type="file" id="file" style={{display:"none"}} onChange={handleImg}/>
                    <img src="./camera.png" alt="" onClick={handleOpenCamera} />
                    <img src="./mic.png" alt="" />
                </div>
                <input type="text" placeholder={isCurrentUserBlocked || isReceiverBlocked?"You cannot send message":"Type your message ..."} value={text} onChange={(e)=>setText(e.target.value)} disabled={isCurrentUserBlocked || isReceiverBlocked}/>
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={()=>setEmojiMode((prev)=>!prev)}/>
                    <div className="picker">
                        {emojiMode && <EmojiPicker onEmojiClick={handleEmoji}/>}
                    </div>
                </div>
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
                    Send
                </button>
            </div>
        </div>
    );
};