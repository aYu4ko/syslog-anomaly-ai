import re

class LogParser:
    def parse(self, log_content):
        errors = len(re.findall(r'error|fail|panic', log_content, re.I))
        cpu = len(re.findall(r'cpu', log_content, re.I))
        disk = len(re.findall(r'disk', log_content, re.I))
        return [errors, cpu, disk]
