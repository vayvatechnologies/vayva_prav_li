-- Table: public.prav_ai_application_settings

-- DROP TABLE IF EXISTS public.prav_ai_application_settings;


CREATE TABLE IF NOT EXISTS public.prav_ai_application_settings
(
    id SERIAL PRIMARY KEY,
    applicationname text COLLATE pg_catalog."default",
    applicationlogo text COLLATE pg_catalog."default",
    applicationversion text COLLATE pg_catalog."default",
    applicationdescription text COLLATE pg_catalog."default",
    companyname text COLLATE pg_catalog."default",
    companylogo text COLLATE pg_catalog."default",
    companywebsite text COLLATE pg_catalog."default",
    themedefault text COLLATE pg_catalog."default",
    enablethemechange boolean,
    enableai boolean,
    supportemail text COLLATE pg_catalog."default",
    supportphone text COLLATE pg_catalog."default",
    documentationurl text COLLATE pg_catalog."default",
    termsurl text COLLATE pg_catalog."default",
    privacyurl text COLLATE pg_catalog."default",
    ismaintenancemode boolean,
    maintenancemessage text COLLATE pg_catalog."default",
    apibaseurl text COLLATE pg_catalog."default",
    cdnurl text COLLATE pg_catalog."default",
    allowedlanguages jsonb,
    defaultlanguage text COLLATE pg_catalog."default",
    allowlanguagechange boolean,
    security_sessiontimeoutminutes integer,
    security_maxloginattempts integer,
    analyticsenabled boolean,
    analyticsprovider text COLLATE pg_catalog."default",
    allowlogin boolean,
    allowregistration boolean,
    allowsociallogin boolean,
    allowedsocialproviders jsonb,
    registrationapprovalrequired boolean,
    allowpasswordlogin boolean,
    allowotplogin boolean,
    otplength integer,
    otpexpiryseconds integer,
    otpresendcooldownseconds integer,
    passwordminlength integer,
    passwordrequirenumber boolean,
    passwordrequiresymbol boolean,
    passwordrequireuppercase boolean,
    maxloginattempts integer,
    lockoutdurationminutes integer,
    enabletwofactorauth boolean,
    twofactormethods jsonb,
    sessiontimeoutminutes integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT	 
)
 
 CREATE TABLE IF NOT EXISTS public.prav_ai_users_notifications
(
    notification_id SERIAL PRIMARY KEY,
    user_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    title character varying(255) COLLATE pg_catalog."default" NOT NULL,
    sub_title character varying(255) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    icon character varying(255) COLLATE pg_catalog."default",
    priority character varying(50) COLLATE pg_catalog."default",
    notification_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notification_expiry_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '1 day'::interval),
    unread boolean DEFAULT false,
	created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT
)

CREATE TABLE IF NOT EXISTS public.prav_ai_users
(
    id SERIAL PRIMARY KEY,
    user_id text GENERATED ALWAYS AS ('pravAIUser_' || id) STORED,
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    first_name character varying(100) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    last_name character varying(100) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    initial character varying(100) COLLATE pg_catalog."default" DEFAULT 'Info'::character varying,
    phone_number character varying(15) COLLATE pg_catalog."default",
    email character varying(255) COLLATE pg_catalog."default",
    date_of_birth date,
    gender character varying(10) COLLATE pg_catalog."default",
    daily_water_goal_l numeric(4,1),
    daily_sleep_goal_hr numeric(3,1),
    daily_steps_goal integer,
    profile_photo_url text COLLATE pg_catalog."default",
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    auth_token text COLLATE pg_catalog."default",
    auth_token_expires_at timestamp without time zone,
    userplan character varying(100) COLLATE pg_catalog."default" DEFAULT 'Basic'::character varying,
    isadmin boolean DEFAULT false,
    status integer DEFAULT 0,
    theme_preference character varying(20) COLLATE pg_catalog."default" DEFAULT 'sap_horizon'::character varying,
    last_login_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    timezone character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'UTC'::character varying,
    dateformat character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'dd/MM/YYYY'::character varying,
    datetimeformat character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'dd,MMM yyyy hh:mm:ss a'::character varying,
    
    
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT,	 
    CONSTRAINT prav_ai_users_username_key UNIQUE (username)
)


CREATE TABLE IF NOT EXISTS public.prav_ai_user_settings
(
    id SERIAL PRIMARY KEY,
    user_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    date_format character varying(20) COLLATE pg_catalog."default" DEFAULT 'DD/MM/YYYY'::character varying,
    datetime_format character varying(30) COLLATE pg_catalog."default" DEFAULT 'DD/MM/YYYY HH:mm'::character varying,
    theme_preference character varying(50) COLLATE pg_catalog."default" DEFAULT 'Horizon'::character varying,
    user_language character varying(50) COLLATE pg_catalog."default" DEFAULT 'English'::character varying,
    user_notification_daily_summary boolean DEFAULT false,
    user_notification_high_exp_alert boolean DEFAULT false,
    user_notification_monthly_report boolean DEFAULT false,
    user_notification_payment_reminder boolean DEFAULT false,
    user_notification_auto_backup boolean DEFAULT false,
    user_notification_offline_mode boolean DEFAULT false,
    user_expense_monthly_budget numeric(12,2) DEFAULT 10000,
    user_expense_budget_warning_pct numeric(5,2) DEFAULT 75,
    user_expense_default boolean DEFAULT false,
    user_expense_enable_budget_alert boolean DEFAULT false,
    user_expense_recurring character varying(255) COLLATE pg_catalog."default" DEFAULT 'None'::character varying,
    user_expense_default_category character varying(100) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    user_health_water_min numeric(5,2) DEFAULT 2,
    user_health_water_max numeric(5,2) DEFAULT 10,
    user_health_water_reminder_frequency character varying(50) COLLATE pg_catalog."default" DEFAULT '30 minutes'::character varying,
    user_health_water_low_intake_notification boolean DEFAULT false,
    user_health_sleep_min numeric(5,2) DEFAULT 2,
    user_health_sleep_max numeric(5,2) DEFAULT 12,
    user_health_sleep_time time without time zone,
    user_health_wake_up_time time without time zone,
    user_health_low_sleep_alert boolean DEFAULT false,
    user_health_sleep_alert_time time without time zone,
    user_health_steps_goal integer DEFAULT 5000,
    user_health_steps_check_interval character varying(50) COLLATE pg_catalog."default" DEFAULT '2 hours'::character varying,
 
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT

)



CREATE TABLE IF NOT EXISTS public.prav_ai_user_health_status
(
    id SERIAL PRIMARY KEY,
    user_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    date date NOT NULL,
    watercurrent integer,
    watergoal integer,
    sleepcurrent integer,
    sleepgoal integer,
    stepscurrent integer,
    stepsgoal integer, 
    recorded_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT
)

ALTER TABLE public.prav_ai_user_health_status
ADD CONSTRAINT user_date_unique UNIQUE (user_id, date);

CREATE TABLE IF NOT EXISTS public.prav_ai_user_expense_config
(
    id SERIAL PRIMARY KEY,
    user_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    expense_setting_type character varying(100) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    key character varying(100) COLLATE pg_catalog."default" NOT NULL,
     
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT,	
    CONSTRAINT prav_ai_user_expense_unique UNIQUE (user_id, expense_setting_type, name),
    CONSTRAINT unique_user_setting UNIQUE (user_id, expense_setting_type, name)
)


CREATE TABLE IF NOT EXISTS public.prav_ai_users_calenderevents
(
    id SERIAL PRIMARY KEY,
    user_id character varying(100) COLLATE pg_catalog."default",
    flagname character varying(50) COLLATE pg_catalog."default",
    title character varying(200) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    status character varying(30) COLLATE pg_catalog."default",
    priority_text character varying(30) COLLATE pg_catalog."default",
    priority_type character varying(30) COLLATE pg_catalog."default",
    label character varying(50) COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    icon character varying(100) COLLATE pg_catalog."default",
    start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active character(1) COLLATE pg_catalog."default" DEFAULT 'Y'::bpchar,
    source_system character varying(50) COLLATE pg_catalog."default",
    reference_id character varying(100) COLLATE pg_catalog."default",
    color_code character varying(20) COLLATE pg_catalog."default",
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,

    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT,	

    version_no integer DEFAULT 1
    )



CREATE TABLE IF NOT EXISTS public.prav_ai_users_reminder_recurring
(
    recurring_id SERIAL PRIMARY KEY,
    reminder_id integer NOT NULL,
    user_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    frequency character varying(50) COLLATE pg_catalog."default",
    "interval" integer,
    days_of_week character varying(50) COLLATE pg_catalog."default",
    day_of_month integer,
    month_of_year integer,
    next_trigger_datetime timestamp without time zone NOT NULL,
    end_date timestamp without time zone,

    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT
)



CREATE TABLE IF NOT EXISTS public.prav_ai_users_upcoming_reminders
(
    reminder_id SERIAL PRIMARY KEY,
    user_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
    title character varying(255) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    datetime timestamp with time zone NOT NULL,
    unread boolean DEFAULT true,
    priority character varying(50) COLLATE pg_catalog."default",
    author_name character varying(100) COLLATE pg_catalog."default",
    author_picture character varying(255) COLLATE pg_catalog."default",
    status character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'New'::character varying,
    reminder_type character varying(50) COLLATE pg_catalog."default",
    reminder_parent_id bigint,

    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT
    )



CREATE TABLE IF NOT EXISTS public.prav_ai_users_expensetracker
(
    id SERIAL PRIMARY KEY,
    user_id character varying(100) COLLATE pg_catalog."default",
    transactiontime timestamp with time zone,
    transactiondate date,
    category character varying(100) COLLATE pg_catalog."default",
    subcategory character varying(100) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    amount numeric(10,2),
    cycle character varying(50) COLLATE pg_catalog."default",
    type character varying(50) COLLATE pg_catalog."default",
    flow character varying(50) COLLATE pg_catalog."default",
    payment_mode character varying(50) COLLATE pg_catalog."default",
    is_planned boolean,
    saving_impact boolean,
    with_whom character varying(100) COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    merchant_name character varying(100) COLLATE pg_catalog."default",
    expense_mood character varying(50) COLLATE pg_catalog."default",
    payment_status character varying(50) COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default",
    created_on timestamp without time zone,
     modified_on timestamp without time zone,
    modified_by character varying(50) COLLATE pg_catalog."default",
    deleted_by character varying(50) COLLATE pg_catalog."default",
    deleted_on timestamp without time zone,
    

    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT

)



CREATE TABLE IF NOT EXISTS public.prav_ai_users_expense_categories
(
    id SERIAL PRIMARY KEY,
    user_id character varying(100) COLLATE pg_catalog."default" NOT NULL,
    category character varying(100) COLLATE pg_catalog."default" NOT NULL,
    subcategory character varying(100) COLLATE pg_catalog."default",
    suggestions text COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    spend_limit_month numeric(10,2),
    yearlimit integer,
    monthlimit integer,
    weeklimit integer,
    quarterlimit integer,
    dailylimit numeric(10,2),
    payment_mode character varying(150) COLLATE pg_catalog."default",
    is_planned boolean DEFAULT false,
    recurring boolean DEFAULT false,
    recurring_start_date date,
    recurringtype character varying(50) COLLATE pg_catalog."default" DEFAULT 'None'::character varying,
    recurringinterval integer,
    recurring_days_of_week jsonb,
    recurring_day_of_month integer,
    recurring_month_of_year integer,
    end_date_range character varying(50) COLLATE pg_catalog."default" DEFAULT 'None'::character varying,
    end_date_by date,
    end_interval integer,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'Active'::character varying,
    is_deleted boolean DEFAULT false,
     
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT,
	aux3 TEXT	
)



CREATE TABLE IF NOT EXISTS public.prav_ai_users_expense_spends
(
    id  SERIAL PRIMARY KEY,
    user_id character varying(100) COLLATE pg_catalog."default",
    transactiondatetime timestamp with time zone NOT NULL,
    category character varying(100) COLLATE pg_catalog."default",
    subcategory character varying(100) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    amount numeric(10,2),
    cycle character varying(50) COLLATE pg_catalog."default",
    type character varying(50) COLLATE pg_catalog."default",
    flow character varying(50) COLLATE pg_catalog."default",
    payment_mode character varying(50) COLLATE pg_catalog."default",
    is_planned boolean,
    saving_impact boolean,
    with_whom character varying(100) COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    merchant_name character varying(100) COLLATE pg_catalog."default",
    expense_mood character varying(50) COLLATE pg_catalog."default",
    payment_status character varying(50) COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default",
    is_deleted boolean DEFAULT false,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(50) COLLATE pg_catalog."default",
    modified_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    modified_by character varying(50) COLLATE pg_catalog."default",
    deleted_by character varying(50) COLLATE pg_catalog."default",
    deleted_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
     created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
	deleted_at timestamp without time zone,
	aux1 TEXT,
	aux2 TEXT
)

drop table prav_ai_user_subscriptions
CREATE TABLE prav_ai_user_subscriptions (
    id SERIAL PRIMARY KEY,
    
    user_id  VARCHAR(50) NOT NULL,
    
    userplan VARCHAR(50) NOT NULL,
    
    subscription_type  VARCHAR(50) NOT NULL,
    
    subscription_amount DECIMAL(10,2) NOT NULL,
    
    payment_datetime timestamp with time zone,
    
    next_payment_date timestamp with time zone ,
    
    status  VARCHAR(50) DEFAULT 'active',
    
    payment_screenshot BYTEA,
    
    -- Audit Columns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    updated_by INT,
    
    deleted_at TIMESTAMP NULL,
    deleted_by INT
    
);
ALTER TABLE prav_ai_user_subscriptions
ADD COLUMN payment_screenshot_type VARCHAR(50);
ALTER TABLE prav_ai_users
ALTER COLUMN dateformat SET DEFAULT 'dd/MM/YYYY';

ALTER TABLE prav_ai_users
ALTER COLUMN datetimeformat SET DEFAULT 'dd,MMM yyyy hh:mm:ss a';
