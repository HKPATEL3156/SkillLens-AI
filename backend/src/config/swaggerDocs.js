/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "699ad56f9e5af4b72afe104a"
 *         username:
 *           type: string
 *           example: "johndoe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         role:
 *           type: string
 *           enum: [user, admin, recruiter]
 *           example: "user"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         openToWork:
 *           type: boolean
 *           example: true
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["React", "Node.js", "MongoDB"]
 *         education:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 example: "Bachelor"
 *               institution:
 *                 type: string
 *                 example: "Charotar University"
 *               cgpa:
 *                 type: number
 *                 example: 8.5
 *         experience:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *                 example: "Acme Corp"
 *               role:
 *                 type: string
 *                 example: "Frontend Developer"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00Z"
 * 
 *     Company:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "69f22acdd3de5a1b31aa9f6e"
 *         company_name:
 *           type: string
 *           example: "Google Inc."
 *         company_email:
 *           type: string
 *           example: "recruiting@google.com"
 *         website:
 *           type: string
 *           example: "https://google.com"
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           example: "approved"
 *         is_verified:
 *           type: boolean
 *           example: true
 * 
 *     Job:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6a85ab461e363fc0edea41cd"
 *         title:
 *           type: string
 *           example: "Senior Software Engineer"
 *         job_role:
 *           type: string
 *           example: "Developer"
 *         required_skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["JavaScript", "React", "Node.js"]
 *         job_type:
 *           type: string
 *           enum: [full-time, part-time, internship, contract]
 *           example: "full-time"
 *         work_mode:
 *           type: string
 *           enum: [onsite, remote, hybrid]
 *           example: "remote"
 *         salary_min:
 *           type: number
 *           example: 600000
 *         salary_max:
 *           type: number
 *           example: 1200000
 * 
 *     Application:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6a927b9be54fd0fed9a41db3"
 *         userId:
 *           type: string
 *           example: "699ad56f9e5af4b72afe104a"
 *         jobId:
 *           type: string
 *           example: "6a85ab461e363fc0edea41cd"
 *         coverLetter:
 *           type: string
 *           example: "I am excited to apply for this job."
 *         status:
 *           type: string
 *           enum: [applied, shortlisted, rejected, hired]
 *           example: "applied"
 * 
 *     Career:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "69bee22170969429f53961db"
 *         userId:
 *           type: string
 *           example: "699ad56f9e5af4b72afe104a"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Python", "SQL", "Docker"]
 *         extractedSkills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Python", "SQL", "Docker"]
 * 
 *     QuizAttempt:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "699ad56f9e5af4b72afe104a_attempt"
 *         userId:
 *           type: string
 *           example: "699ad56f9e5af4b72afe104a"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["JavaScript"]
 *         totalMarks:
 *           type: number
 *           example: 100
 *         obtainedMarks:
 *           type: number
 *           example: 80
 *         status:
 *           type: string
 *           enum: [started, submitted, cancelled]
 *           example: "submitted"
 * 
 *     Activity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "activity_id_1"
 *         userId:
 *           type: string
 *           example: "699ad56f9e5af4b72afe104a"
 *         type:
 *           type: string
 *           example: "resume_upload"
 *         message:
 *           type: string
 *           example: "Resume uploaded successfully"
 */

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new candidate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error / Email already exists
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate User/Recruiter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsIn..."
 *                 role:
 *                   type: string
 *                   example: "user"
 *       401:
 *         description: Invalid credentials
 */

/**
 * @openapi
 * /api/auth/set-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Initial password setup (Development Helper)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "NewSecPassword123!"
 *     responses:
 *       200:
 *         description: Password set successfully
 *       403:
 *         description: Not allowed (insecure password setting disabled)
 */

/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/auth/profile/photo:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Upload profile photo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 */

/**
 * @openapi
 * /api/auth/activity/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user activity log
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 */

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old
 *               - new
 *             properties:
 *               old:
 *                 type: string
 *                 example: "OldPassword123!"
 *               new:
 *                 type: string
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 */

/**
 * @openapi
 * /api/profile/me:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get full candidate profile details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @openapi
 * /api/profile/:
 *   patch:
 *     tags:
 *       - Profile
 *     summary: Partial update candidate profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */

/**
 * @openapi
 * /api/profile/resume:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Upload candidate resume document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded and parsed successfully
 */

/**
 * @openapi
 * /api/profile/skills:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get candidate technical skills
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of skills
 */

/**
 * @openapi
 * /api/profile/activity:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get user activity history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity records
 */

/**
 * @openapi
 * /api/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get public job listings
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by title/company
 *     responses:
 *       200:
 *         description: List of jobs
 * 
 * /api/jobs/{id}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get details of a job
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 * 
 * /api/jobs/{id}/apply:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Apply to a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Applied successfully
 */

/**
 * @openapi
 * /api/quiz/generate:
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Trigger background quiz generation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               quizName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quiz generation job started
 * 
 * /api/quiz/generate/status:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Get quiz generation status
 *     responses:
 *       200:
 *         description: Quiz generation jobs status list
 * 
 * /api/quiz/generate/logs:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Get quiz generator output logs
 *     responses:
 *       200:
 *         description: Text logs
 * 
 * /api/quiz/paper-status:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Check if question paper template is available
 *     responses:
 *       200:
 *         description: Paper status response
 * 
 * /api/quiz/questions:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Fetch questions for active attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: attemptId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of questions
 * 
 * /api/quiz/start:
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Record start of attempt
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               quizName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attempt recorded
 * 
 * /api/quiz/save:
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Save intermediate attempt answers (checkpoint)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attemptId:
 *                 type: string
 *               checkpoint:
 *                 type: object
 *     responses:
 *       200:
 *         description: Checkpoint saved
 * 
 * /api/quiz/submit:
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Finalize and submit quiz attempt
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attemptId:
 *                 type: string
 *               obtainedMarks:
 *                 type: number
 *               totalMarks:
 *                 type: number
 *               status:
 *                 type: string
 *               answersSummary:
 *                 type: object
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 * 
 * /api/quiz/attempts:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Get past quiz attempts for candidate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attempts
 * 
 * /api/quiz/selected-skills:
 *   get:
 *     tags:
 *       - Quiz
 *     summary: Get active selected skills
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active selected skills
 *   post:
 *     tags:
 *       - Quiz
 *     summary: Save active selected skills
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Saved successfully
 */

/**
 * @openapi
 * /api/recruiter/register:
 *   post:
 *     tags:
 *       - Recruiter
 *     summary: Register recruiter and company details
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               company_email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               company_profile_pdf:
 *                 type: string
 *                 format: binary
 *               registration_certificate:
 *                 type: string
 *                 format: binary
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Recruiter registered successfully
 * 
 * /api/recruiter/company/documents:
 *   post:
 *     tags:
 *       - Recruiter
 *     summary: Upload/Update company documentation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               company_profile_pdf:
 *                 type: string
 *                 format: binary
 *               registration_certificate:
 *                 type: string
 *                 format: binary
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 * 
 * /api/recruiter/jobs:
 *   post:
 *     tags:
 *       - Recruiter
 *     summary: Create new job posting (Legacy plural endpoint)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       201:
 *         description: Job created
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: List jobs posted by company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 * 
 * /api/recruiter/jobs/{id}:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: Get recruiter job detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *   put:
 *     tags:
 *       - Recruiter
 *     summary: Update job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       200:
 *         description: Job updated
 *   delete:
 *     tags:
 *       - Recruiter
 *     summary: Delete job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted
 * 
 * /api/recruiter/job:
 *   post:
 *     tags:
 *       - Recruiter
 *     summary: Create new job posting with document attachments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               required_skills:
 *                 type: string
 *                 description: Comma separated list of skills
 *               job_description_pdf:
 *                 type: string
 *                 format: binary
 *               company_policy_pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Job created
 * 
 * /api/recruiter/job/{id}:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: Get singular job detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *   put:
 *     tags:
 *       - Recruiter
 *     summary: Update singular job details with files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               job_description_pdf:
 *                 type: string
 *                 format: binary
 *               company_policy_pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Job updated
 *   delete:
 *     tags:
 *       - Recruiter
 *     summary: Delete recruiter job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted
 * 
 * /api/recruiter/dashboard:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: Get dashboard statistics for recruiter company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 * 
 * /api/recruiter/job/{id}/applicants:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: List job applicants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applicants list
 * 
 * /api/recruiter/application/{id}/status:
 *   patch:
 *     tags:
 *       - Recruiter
 *     summary: Update applicant pipeline status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [applied, shortlisted, rejected, hired]
 *     responses:
 *       200:
 *         description: Application status updated
 * 
 * /api/recruiter/activity:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: List recruiter activity history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity list
 * 
 * /api/recruiter/notifications:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: List recruiter notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications list
 * 
 * /api/recruiter/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Recruiter
 *     summary: Mark recruiter notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification updated
 * 
 * /api/recruiter/candidate/{id}:
 *   get:
 *     tags:
 *       - Recruiter
 *     summary: Get details of candidate profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate details
 */

/**
 * @openapi
 * /api/career/me:
 *   get:
 *     tags:
 *       - Career
 *     summary: Get candidate career profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Career profile details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Career'
 *   post:
 *     tags:
 *       - Career
 *     summary: Save/Update candidate career details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Career'
 *     responses:
 *       200:
 *         description: Career data updated
 * 
 * /api/career/upload-resume:
 *   post:
 *     tags:
 *       - Career
 *     summary: Upload and parse resume
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume parsed successfully
 * 
 * /api/career/upload-result:
 *   post:
 *     tags:
 *       - Career
 *     summary: Upload scoring sheet (offline result)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scores saved
 * 
 * /api/career/download-resume:
 *   get:
 *     tags:
 *       - Career
 *     summary: Download resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resume file buffer
 * 
 * /api/career/download-result:
 *   get:
 *     tags:
 *       - Career
 *     summary: Download scorecard document
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document buffer
 * 
 * /api/career/skills:
 *   get:
 *     tags:
 *       - Career
 *     summary: Get technical skills list
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills list
 * 
 * /api/career/eligibility:
 *   get:
 *     tags:
 *       - Career
 *     summary: Check eligibility for job role
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eligibility analysis
 * 
 * /api/career/save-qualified:
 *   post:
 *     tags:
 *       - Career
 *     summary: Manually save qualified skills
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved
 * 
 * /api/career/compute-save-qualified:
 *   post:
 *     tags:
 *       - Career
 *     summary: Run recommendation logic and save
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended roles
 * 
 * /api/career/save-role:
 *   post:
 *     tags:
 *       - Career
 *     summary: Set target job role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role saved
 * 
 * /api/career/select-skills:
 *   post:
 *     tags:
 *       - Career
 *     summary: Select skills for evaluations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills saved
 * 
 * /api/career/skill-gap:
 *   post:
 *     tags:
 *       - Career
 *     summary: Perform skill gap analysis
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Skill gap analysis details
 * 
 * /api/career/analyze:
 *   post:
 *     tags:
 *       - Career
 *     summary: Full career assessment profile report (Gemini)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gemini assessment details
 * 
 * /api/career/submit-result:
 *   post:
 *     tags:
 *       - Career
 *     summary: Submit general test result sheet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Result sheet saved
 */

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 * 
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user accounts
 * 
 * /api/admin/user/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update user details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 * 
 * /api/admin/user/{id}/block:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Block/Unblock user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User block status toggled
 * 
 * /api/admin/companies:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List registered companies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 * 
 * /api/admin/company/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get company details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company details
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update company details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company updated
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete company details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company deleted
 * 
 * /api/admin/company/{id}/block:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Block/Unblock recruiter company profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block status toggled
 * 
 * /api/admin/company/{id}/approve:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Approve recruiter registration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company registration approved
 * 
 * /api/admin/company/{id}/reject:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Reject recruiter registration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company registration rejected
 * 
 * /api/admin/jobs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all platform jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jobs list
 * 
 * /api/admin/job/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get job details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted
 * 
 * /api/admin/reports:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get platform reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports data
 * 
 * /api/admin/create:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create new admin account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created
 * 
 * /api/admin/password:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Change admin password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old
 *               - new
 *             properties:
 *               old:
 *                 type: string
 *               new:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 * 
 * /api/admin/settings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings profile
 * 
 * /api/admin/profile:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin profile details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin details
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update admin profile details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @openapi
 * /api/ml/job-role:
 *   post:
 *     tags:
 *       - Machine Learning
 *     summary: Get recommended job roles based on assessment scores & skills
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skills
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               academic_score:
 *                 type: number
 *               avg_skill_score:
 *                 type: number
 *     responses:
 *       200:
 *         description: Recommended job roles list
 * 
 * /api/ml/parse-resume:
 *   post:
 *     tags:
 *       - Machine Learning
 *     summary: Parse resume document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filepath:
 *                 type: string
 *               resume_text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Parsed JSON resume structure
 */

/**
 * @openapi
 * /api/activity/me:
 *   get:
 *     tags:
 *       - Activity
 *     summary: List user activity history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of activities
 */
