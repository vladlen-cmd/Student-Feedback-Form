pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        PROJECT_DIR  = "${WORKSPACE}"
        PYTHON       = 'python3'
        REPORT_DIR   = 'reports'
        CHROMEDRIVER = "${WORKSPACE}/chromedriver"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Environment') {
            steps {
                sh """
                    ${PYTHON} -m pip install --upgrade pip --quiet
                    ${PYTHON} -m pip install selenium webdriver-manager pytest pytest-html --quiet
                """
            }
        }

        stage('Verify ChromeDriver') {
            steps {
                sh """
                    if [ -f "${CHROMEDRIVER}" ]; then
                        chmod +x "${CHROMEDRIVER}"
                        echo "Local chromedriver: \$(${CHROMEDRIVER} --version)"
                    else
                        echo "No local chromedriver found — webdriver_manager will download one at runtime."
                    fi

                    CHROME_BIN=\$(which google-chrome 2>/dev/null || \
                                  which chromium-browser 2>/dev/null || \
                                  echo '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                    "\${CHROME_BIN}" --version 2>/dev/null || echo "Chrome binary not found at default path."
                """
            }
        }

        stage('Lint') {
            steps {
                sh "${PYTHON} -m py_compile test_form.py && echo 'test_form.py: OK'"
            }
        }

        stage('Run Selenium Tests') {
            steps {
                sh """
                    mkdir -p ${REPORT_DIR}
                    cd "${PROJECT_DIR}"
                    ${PYTHON} -m pytest test_form.py -v \
                        --html=${REPORT_DIR}/test_report.html \
                        --self-contained-html \
                        --tb=short \
                        -p no:cacheprovider
                """
            }
        }
    }

    post {
        always {
            publishHTML(target: [
                allowMissing:          false,
                alwaysLinkToLastBuild: true,
                keepAll:               true,
                reportDir:             'reports',
                reportFiles:           'test_report.html',
                reportName:            'Selenium Test Report — Student Feedback Form'
            ])
        }
        success {
            echo "All tests passed on branch: ${env.BRANCH_NAME ?: 'local'}"
        }
        failure {
            echo "Tests failed — check the Selenium Test Report above."
        }
        cleanup {
            cleanWs()
        }
    }
}
