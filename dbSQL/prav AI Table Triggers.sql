-- For prav_ai_application_settings
CREATE TRIGGER trg_update_updated_at_settings
BEFORE UPDATE ON public.prav_ai_application_settings
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

-- For prav_ai_application_settings
CREATE TRIGGER trg_soft_delete_settings
BEFORE DELETE ON public.prav_ai_application_settings
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();

-- For prav_ai_users_notifications
CREATE TRIGGER trg_update_updated_at_notifications
BEFORE UPDATE ON public.prav_ai_users_notifications
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();

-- For prav_ai_users_notifications
CREATE TRIGGER trg_soft_delete_notifications
BEFORE DELETE ON public.prav_ai_users_notifications
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();




-- For prav_ai_users
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();



-- For prav_ai_user_settings
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_user_settings
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_user_settings
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_user_settings
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();




-- For prav_ai_user_health_status
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_user_health_status
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_user_health_status
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_user_health_status
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();



-- For prav_ai_user_expense_config
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_user_expense_config
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_user_expense_config
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_user_expense_config
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();





-- For prav_ai_users_calenderevents
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users_calenderevents
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users_calenderevents
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users_calenderevents
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();


-- For prav_ai_users_reminder_recurring
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users_reminder_recurring
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users_reminder_recurring
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users_reminder_recurring
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();

-- For prav_ai_users_upcoming_reminders
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users_upcoming_reminders
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users_upcoming_reminders
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users_upcoming_reminders
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();



-- For prav_ai_users_expensetracker
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users_expensetracker
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users_expensetracker
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users_expensetracker
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();




-- For prav_ai_users_expense_categories
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users_expense_categories
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users_expense_categories
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users_expense_categories
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();






-- For prav_ai_users_expense_spends
CREATE TRIGGER trg_update_updated_at_users
BEFORE UPDATE ON public.prav_ai_users_expense_spends
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();


-- For prav_ai_users_expense_spends
CREATE TRIGGER trg_soft_delete_users
BEFORE DELETE ON public.prav_ai_users_expense_spends
FOR EACH ROW
EXECUTE FUNCTION fn_soft_delete();


