import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

_DIR              = os.path.dirname(os.path.abspath(__file__))
CHROMEDRIVER_PATH = os.path.join(_DIR, "chromedriver")
FORM_URL          = f"file:///{os.path.join(_DIR, 'index.html')}"


def _chrome_options() -> Options:
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument("--allow-file-access-from-files")
    opts.add_argument("--disable-web-security")
    return opts


@pytest.fixture(scope="module")
def driver():
    opts = _chrome_options()
    drv  = None

    if os.path.isfile(CHROMEDRIVER_PATH):
        try:
            drv = webdriver.Chrome(
                service=Service(executable_path=CHROMEDRIVER_PATH),
                options=opts,
            )
        except Exception as local_err:
            print(f"[warn] Local chromedriver failed ({local_err}); falling back to webdriver_manager.")
            drv = None

    if drv is None:
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            drv = webdriver.Chrome(
                service=Service(ChromeDriverManager().install()),
                options=opts,
            )
        except Exception as wdm_err:
            raise RuntimeError(f"Could not start Chrome.\nwebdriver_manager error: {wdm_err}") from wdm_err

    drv.implicitly_wait(5)
    yield drv
    drv.quit()


def load_form(driver):
    driver.get(FORM_URL)
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "feedbackForm"))
    )
    time.sleep(0.4)


def fill_field(driver, field_id: str, value: str):
    el = driver.find_element(By.ID, field_id)
    el.clear()
    el.send_keys(value)
    driver.execute_script(
        "arguments[0].dispatchEvent(new Event('blur', {bubbles:true}));", el
    )
    time.sleep(0.15)


def js_submit(driver):
    driver.execute_script("document.getElementById('submitBtn').click();")
    time.sleep(0.5)


def js_click(driver, element):
    driver.execute_script("arguments[0].click();", element)


def error_text(driver, error_id: str) -> str:
    return driver.find_element(By.ID, error_id).text.strip()


def select_gender(driver, value: str):
    radio = driver.find_element(By.CSS_SELECTOR, f'input[name="gender"][value="{value}"]')
    driver.execute_script("arguments[0].click();", radio)
    driver.execute_script(
        "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));", radio
    )
    time.sleep(0.15)


def select_department(driver, value: str):
    sel = Select(driver.find_element(By.ID, "department"))
    sel.select_by_value(value)
    driver.execute_script(
        "document.getElementById('department').dispatchEvent(new Event('change', {bubbles:true}));"
    )
    time.sleep(0.15)


VALID = {
    "name":     "Rahul Mehta",
    "email":    "rahul.mehta@college.edu",
    "mobile":   "9876543210",
    "dept":     "CSE",
    "gender":   "Male",
    "feedback": "The faculty was very helpful and the course material was well structured and easy to understand.",
}


class TestTC01PageLoad:
    def test_tc01_page_title(self, driver):
        load_form(driver)
        assert "Feedback" in driver.title or "Student" in driver.title

    def test_tc01_form_element_present(self, driver):
        assert driver.find_element(By.ID, "feedbackForm").is_displayed()

    def test_tc01_name_field_present(self, driver):
        assert driver.find_element(By.ID, "studentName").is_displayed()

    def test_tc01_email_field_present(self, driver):
        assert driver.find_element(By.ID, "emailId").is_displayed()

    def test_tc01_mobile_field_present(self, driver):
        assert driver.find_element(By.ID, "mobileNumber").is_displayed()

    def test_tc01_department_dropdown_present(self, driver):
        assert driver.find_element(By.ID, "department").is_displayed()

    def test_tc01_gender_options_present(self, driver):
        radios = driver.find_elements(By.CSS_SELECTOR, 'input[name="gender"]')
        assert len(radios) >= 3

    def test_tc01_feedback_textarea_present(self, driver):
        assert driver.find_element(By.ID, "feedbackComments").is_displayed()

    def test_tc01_submit_button_present(self, driver):
        btn = driver.find_element(By.ID, "submitBtn")
        assert btn.is_displayed() and btn.is_enabled()

    def test_tc01_reset_button_present(self, driver):
        assert driver.find_element(By.ID, "resetBtn").is_displayed()


class TestTC03BlankSubmission:
    def test_tc03_blank_name_shows_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "name-error") != ""

    def test_tc03_blank_email_shows_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "email-error") != ""

    def test_tc03_blank_mobile_shows_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "mobile-error") != ""

    def test_tc03_blank_department_shows_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "department-error") != ""

    def test_tc03_blank_gender_shows_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "gender-error") != ""

    def test_tc03_blank_feedback_shows_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "feedback-error") != ""

    def test_tc03_success_message_hidden_on_blank_submit(self, driver):
        load_form(driver)
        js_submit(driver)
        assert not driver.find_element(By.ID, "successMsg").is_displayed()


class TestTC04EmailValidation:
    @pytest.mark.parametrize("bad_email", [
        "plainaddress",
        "missing@",
        "@nodomain.com",
        "double@@domain.com",
        "no-at-sign.com",
    ])
    def test_tc04_invalid_email_rejected(self, driver, bad_email):
        load_form(driver)
        fill_field(driver, "emailId", bad_email)
        js_submit(driver)
        assert error_text(driver, "email-error") != ""

    def test_tc04_valid_email_accepted(self, driver):
        load_form(driver)
        fill_field(driver, "emailId", "student@college.edu")
        js_submit(driver)
        assert error_text(driver, "email-error") == ""


class TestTC05MobileValidation:
    @pytest.mark.parametrize("bad_mobile", [
        "abc",
        "12ab34",
        "12",
        "1" * 16,
    ])
    def test_tc05_invalid_mobile_rejected(self, driver, bad_mobile):
        load_form(driver)
        fill_field(driver, "mobileNumber", bad_mobile)
        js_submit(driver)
        assert error_text(driver, "mobile-error") != ""

    def test_tc05_valid_10_digit_mobile_accepted(self, driver):
        load_form(driver)
        fill_field(driver, "mobileNumber", "9876543210")
        js_submit(driver)
        assert error_text(driver, "mobile-error") == ""


class TestTC06DropdownSelection:
    EXPECTED_VALUES = [
        "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL",
        "MBA", "BBA", "FINANCE",
        "PHYSICS", "CHEMISTRY", "MATH", "BIO",
        "ENGLISH", "HISTORY", "PSYCH", "SOCIO",
    ]

    def test_tc06_all_departments_present(self, driver):
        load_form(driver)
        sel = Select(driver.find_element(By.ID, "department"))
        actual = [o.get_attribute("value") for o in sel.options if o.get_attribute("value")]
        for dept in self.EXPECTED_VALUES:
            assert dept in actual

    def test_tc06_selecting_cse_clears_error(self, driver):
        load_form(driver)
        js_submit(driver)
        assert error_text(driver, "department-error") != ""
        select_department(driver, "CSE")
        assert error_text(driver, "department-error") == ""

    def test_tc06_selection_persists(self, driver):
        load_form(driver)
        select_department(driver, "MBA")
        sel = Select(driver.find_element(By.ID, "department"))
        assert sel.first_selected_option.get_attribute("value") == "MBA"


class TestTC07SubmitButton:
    def test_tc07_valid_submission_shows_success(self, driver):
        load_form(driver)
        fill_field(driver, "studentName",      VALID["name"])
        fill_field(driver, "emailId",          VALID["email"])
        fill_field(driver, "mobileNumber",     VALID["mobile"])
        select_department(driver,              VALID["dept"])
        select_gender(driver,                  VALID["gender"])
        fill_field(driver, "feedbackComments", VALID["feedback"])
        js_submit(driver)
        WebDriverWait(driver, 3).until(
            EC.visibility_of_element_located((By.ID, "successMsg"))
        )
        assert driver.find_element(By.ID, "successMsg").is_displayed()

    def test_tc07_form_hidden_after_successful_submit(self, driver):
        assert not driver.find_element(By.ID, "feedbackForm").is_displayed()

    def test_tc07_success_message_content(self, driver):
        heading = driver.find_element(By.CSS_SELECTOR, "#successMsg h2").text
        assert heading != ""


class TestTC08ResetButton:
    def test_tc08_reset_from_success_screen_shows_form(self, driver):
        WebDriverWait(driver, 5).until(
            EC.visibility_of_element_located((By.ID, "successMsg"))
        )
        driver.execute_script("triggerReset();")
        time.sleep(0.4)
        assert driver.find_element(By.ID, "feedbackForm").is_displayed()
        assert not driver.find_element(By.ID, "successMsg").is_displayed()

    def test_tc08_reset_clears_name_field(self, driver):
        load_form(driver)
        fill_field(driver, "studentName", "Test User")
        js_click(driver, driver.find_element(By.ID, "resetBtn"))
        time.sleep(0.5)
        assert driver.find_element(By.ID, "studentName").get_attribute("value") == ""

    def test_tc08_reset_clears_email_field(self, driver):
        load_form(driver)
        fill_field(driver, "emailId", "test@test.com")
        js_click(driver, driver.find_element(By.ID, "resetBtn"))
        time.sleep(0.5)
        assert driver.find_element(By.ID, "emailId").get_attribute("value") == ""

    def test_tc08_reset_clears_mobile_field(self, driver):
        load_form(driver)
        fill_field(driver, "mobileNumber", "9999999999")
        js_click(driver, driver.find_element(By.ID, "resetBtn"))
        time.sleep(0.5)
        assert driver.find_element(By.ID, "mobileNumber").get_attribute("value") == ""

    def test_tc08_reset_clears_error_states(self, driver):
        load_form(driver)
        js_submit(driver)
        js_click(driver, driver.find_element(By.ID, "resetBtn"))
        time.sleep(0.5)
        assert error_text(driver, "name-error") == ""


class TestTC02ValidData:
    def test_tc02_all_valid_fields_accepted(self, driver):
        load_form(driver)
        fill_field(driver, "studentName",      VALID["name"])
        fill_field(driver, "emailId",          VALID["email"])
        fill_field(driver, "mobileNumber",     VALID["mobile"])
        select_department(driver,              VALID["dept"])
        select_gender(driver,                  VALID["gender"])
        fill_field(driver, "feedbackComments", VALID["feedback"])
        for err_id in ("name-error", "email-error", "mobile-error",
                       "department-error", "gender-error", "feedback-error"):
            assert error_text(driver, err_id) == ""
        js_submit(driver)
        WebDriverWait(driver, 3).until(
            EC.visibility_of_element_located((By.ID, "successMsg"))
        )
        assert driver.find_element(By.ID, "successMsg").is_displayed()


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
