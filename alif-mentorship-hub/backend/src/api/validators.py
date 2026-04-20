import re
import logging
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger('api')


class PhoneNumberValidator:
    """Validator for phone numbers with international format support"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid phone number.')
    
    def __call__(self, value):
        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', value)
        
        # Check format: +[country code][number] or just [number]
        if not re.match(r'^(\+\d{1,3})?\d{7,15}$', cleaned):
            logger.warning(f"Invalid phone number format: {value}")
            raise ValidationError(self.message, code='invalid_phone')
        
        return cleaned


class SomaliPhoneValidator:
    """Validator specifically for Somali phone numbers"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid Somali phone number.')
    
    def __call__(self, value):
        # Somali phone format: +252 [6,7,9]X XXXXXXX or 0[6,7,9]X XXXXXXX
        cleaned = re.sub(r'[^\d+]', '', value)
        
        patterns = [
            r'^\+252[679]\d{7}$',  # International format
            r'^0[679]\d{8}$',      # Local format
            r'^[679]\d{7}$'        # Short format
        ]
        
        if not any(re.match(pattern, cleaned) for pattern in patterns):
            logger.warning(f"Invalid Somali phone number: {value}")
            raise ValidationError(self.message, code='invalid_somali_phone')
        
        return cleaned


class UniversityNameValidator:
    """Validator for university names"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid university name.')
    
    def __call__(self, value):
        if not value or len(value.strip()) < 3:
            raise ValidationError(_('University name must be at least 3 characters.'))
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", value):
            logger.warning(f"Invalid university name format: {value}")
            raise ValidationError(self.message, code='invalid_university_name')
        
        return value.strip()


class FieldOfStudyValidator:
    """Validator for field of study"""
    
    VALID_FIELDS = [
        'Computer Science', 'Software Engineering', 'Information Technology',
        'Business Administration', 'Economics', 'Finance', 'Marketing',
        'Medicine', 'Nursing', 'Public Health', 'Pharmacy',
        'Engineering', 'Civil Engineering', 'Mechanical Engineering',
        'Education', 'Psychology', 'Sociology', 'Political Science',
        'Mathematics', 'Physics', 'Chemistry', 'Biology',
        'Law', 'International Relations', 'Communications',
        'Agriculture', 'Environmental Science', 'Architecture'
    ]
    
    def __init__(self, message=None):
        self.message = message or _('Select a valid field of study.')
    
    def __call__(self, value):
        if not value or value.strip() not in self.VALID_FIELDS:
            logger.warning(f"Invalid field of study: {value}")
            raise ValidationError(
                _('Field of study must be one of: %(fields)s') % {
                    'fields': ', '.join(self.VALID_FIELDS[:10]) + '...'
                },
                code='invalid_field_of_study'
            )
        
        return value.strip()


class GraduationYearValidator:
    """Validator for graduation year"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid graduation year.')
    
    def __call__(self, value):
        from datetime import datetime
        current_year = datetime.now().year
        
        if not isinstance(value, int):
            try:
                value = int(value)
            except (ValueError, TypeError):
                raise ValidationError(self.message, code='invalid_year_format')
        
        if value < 1950 or value > current_year + 10:
            logger.warning(f"Invalid graduation year: {value}")
            raise ValidationError(
                _('Graduation year must be between 1950 and %(max_year)s') % {
                    'max_year': current_year + 10
                },
                code='invalid_graduation_year'
            )
        
        return value


class LinkedInURLValidator:
    """Validator for LinkedIn URLs"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid LinkedIn URL.')
    
    def __call__(self, value):
        if not value:
            return value
        
        # LinkedIn URL patterns
        patterns = [
            r'^https?://(?:www\.)?linkedin\.com/in/[\w\-]+/?$',
            r'^https?://(?:www\.)?linkedin\.com/pub/[\w\-]+/[\w\-]+/[\w\-]+/[\w\-]+/?$'
        ]
        
        if not any(re.match(pattern, value, re.IGNORECASE) for pattern in patterns):
            logger.warning(f"Invalid LinkedIn URL: {value}")
            raise ValidationError(self.message, code='invalid_linkedin_url')
        
        return value


class LanguageValidator:
    """Validator for language codes and names"""
    
    SUPPORTED_LANGUAGES = [
        'English', 'Somali', 'Arabic', 'French', 'Italian',
        'Swahili', 'Oromo', 'Amharic', 'Spanish', 'German'
    ]
    
    def __init__(self, message=None):
        self.message = message or _('Select valid languages.')
    
    def __call__(self, value):
        if not isinstance(value, list):
            raise ValidationError(_('Languages must be provided as a list.'))
        
        if len(value) > 10:
            raise ValidationError(_('Maximum 10 languages allowed.'))
        
        for lang in value:
            if lang not in self.SUPPORTED_LANGUAGES:
                logger.warning(f"Unsupported language: {lang}")
                raise ValidationError(
                    _('Language "%(lang)s" is not supported. Supported languages: %(languages)s') % {
                        'lang': lang,
                        'languages': ', '.join(self.SUPPORTED_LANGUAGES)
                    },
                    code='unsupported_language'
                )
        
        return value


class SessionGoalValidator:
    """Validator for session goals"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid session goal.')
    
    def __call__(self, value):
        if not value or len(value.strip()) < 10:
            raise ValidationError(_('Session goal must be at least 10 characters.'))
        
        if len(value) > 500:
            raise ValidationError(_('Session goal must be less than 500 characters.'))
        
        # Check for inappropriate content (basic filter)
        inappropriate_words = ['spam', 'test123', 'asdf', 'qwerty']
        if any(word in value.lower() for word in inappropriate_words):
            logger.warning(f"Potentially inappropriate session goal: {value[:50]}...")
            raise ValidationError(_('Session goal contains inappropriate content.'))
        
        return value.strip()


class RatingValidator:
    """Validator for rating values (1-5)"""
    
    def __init__(self, message=None):
        self.message = message or _('Rating must be between 1 and 5.')
    
    def __call__(self, value):
        try:
            rating = int(value)
        except (ValueError, TypeError):
            raise ValidationError(_('Rating must be a number.'))
        
        if rating < 1 or rating > 5:
            logger.warning(f"Invalid rating value: {rating}")
            raise ValidationError(self.message, code='invalid_rating')
        
        return rating


class TimezoneValidator:
    """Validator for timezone strings"""
    
    def __init__(self, message=None):
        self.message = message or _('Enter a valid timezone.')
    
    def __call__(self, value):
        import pytz
        
        try:
            pytz.timezone(value)
        except pytz.exceptions.UnknownTimeZoneError:
            logger.warning(f"Invalid timezone: {value}")
            raise ValidationError(self.message, code='invalid_timezone')
        
        return value


# Regex validators for common patterns
username_validator = RegexValidator(
    regex=r'^[a-zA-Z0-9_]{3,30}$',
    message=_('Username must be 3-30 characters long and contain only letters, numbers, and underscores.'),
    code='invalid_username'
)

password_strength_validator = RegexValidator(
    regex=r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
    message=_('Password must be at least 8 characters with uppercase, lowercase, number, and special character.'),
    code='weak_password'
)