import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import listCategories from "./modules/listCategories";
import listThreads from "./modules/listThreads";
import createThread from "./modules/createThread";
import getThread from "./modules/getThread";
import updateThread from "./modules/updateThread";
import createPost from "./modules/createPost";
import updatePost from "./modules/updatePost";
import vote from "./modules/vote";
import acceptPost from "./modules/acceptPost";
import acknowledgeThread from "./modules/acknowledgeThread";
import resolveThread from "./modules/resolveThread";
import listTipsForTrackable from "./modules/listTipsForTrackable";
import listRecent from "./modules/listRecent";
import getPublicProfile from "./modules/getPublicProfile";



const router = Router();
router.use(requireAuth);

// categories
router.get("/categories", listCategories);

// threads
router.get("/threads", listThreads);
router.post("/threads", createThread);
router.get("/threads/:threadId", getThread);
router.patch("/threads/:threadId", updateThread);

// posts
router.post("/threads/:threadId/posts", createPost);
router.patch("/posts/:postId", updatePost);
router.get("/recent", listRecent);

// votes
router.post("/votes", vote);

// moderation
router.post("/threads/:threadId/acknowledge", acknowledgeThread);
router.post("/threads/:threadId/resolve", resolveThread);
router.post("/posts/:postId/accept", acceptPost);

router.get("/profile/:userId", getPublicProfile);

// contextual (trackable tips)
router.get("/tips", listTipsForTrackable);

export default router;
