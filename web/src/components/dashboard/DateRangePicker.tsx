import React from 'react';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { useMediaQuery } from '../ui/use-mobile';
import enLocale from 'antd/es/date-picker/locale/en_US';
import mkLocale from 'antd/es/date-picker/locale/mk_MK';
import 'dayjs/locale/mk';
import { useTranslation } from '../../hooks/useTranslation';

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const { t, language } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 640px)');
  dayjs.locale(language === 'mk' ? 'mk' : 'en');

  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onDateRangeChange({
        from: dates[0].toDate(),
        to: dates[1].toDate(),
      });
    } else {
      onDateRangeChange(undefined);
    }
  };

  const value: [Dayjs, Dayjs] | null =
    dateRange?.from && dateRange?.to ? [dayjs(dateRange.from), dayjs(dateRange.to)] : null;
  const pickerLocale = language === 'mk' ? mkLocale : enLocale;
  const formatString = language === 'mk' ? 'DD MMM YYYY' : 'MMM DD, YYYY';

  return (
    <RangePicker
      value={value}
      onChange={handleChange}
      locale={pickerLocale}
      format={formatString}
      placeholder={[t('dateRange.start'), t('dateRange.end')]}
      allowClear
      size="middle"
      style={{ width: isMobile ? '160px' : '200px' }}
      inputReadOnly={isMobile}
    />
  );
}
