import ChatList from "./chatList/chatList"
import "./list.css"
import Userinfo from "./userinfo/Userinfo"

export default function List(){
    return(
        <div className="list">
            <Userinfo/>
            <ChatList/>
        </div>
    )
}