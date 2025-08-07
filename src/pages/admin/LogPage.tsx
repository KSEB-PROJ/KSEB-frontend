import React, { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { ActionType } from '../../types/admin';
import type { LogAdmin } from '../../types/admin';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    TablePagination, CircularProgress, Alert, TextField, Button, Select, MenuItem,
    Checkbox, ListItemText, OutlinedInput, Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';

const LogPage: React.FC = () => {
    const { logs, logPagination, isLoading, error, fetchLogs } = useAdminStore();

    const [filters, setFilters] = useState({
        actorName: '',
        actionTypes: [] as string[],
        startDate: null as Date | null,
        endDate: null as Date | null,
    });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const handleSearch = useCallback(() => {
        setPage(0);
        fetchLogs({ page: 0, size: rowsPerPage, ...filters });
    }, [rowsPerPage, filters, fetchLogs]);

    const handleReset = () => {
        setPage(0);
        const resetFilters = { actorName: '', actionTypes: [], startDate: null, endDate: null };
        setFilters(resetFilters);
        fetchLogs({ page: 0, size: rowsPerPage, ...resetFilters });
    };

    useEffect(() => {
        fetchLogs({ page, size: rowsPerPage, ...filters });
    }, [page, rowsPerPage, fetchLogs]);

    const getChipColor = (actionType: string) => {
        if (actionType.startsWith('ADMIN')) return 'secondary';
        if (actionType.includes('DELETE')) return 'error';
        if (actionType.includes('UPDATE') || actionType.includes('CHANGE')) return 'warning';
        if (actionType.includes('CREATE') || actionType.includes('REGISTER') || actionType.includes('SEND')) return 'info';
        if (actionType.includes('LOGIN')) return 'success';
        return 'default';
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>로그 필터</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="수행자 이름"
                        variant="outlined"
                        size="small"
                        value={filters.actorName}
                        onChange={(e) => setFilters({ ...filters, actorName: e.target.value })}
                        sx={{ minWidth: '200px', flexGrow: 1 }}
                    />
                    <Select
                        multiple
                        displayEmpty
                        size="small"
                        value={filters.actionTypes}
                        onChange={(e) => setFilters({ ...filters, actionTypes: e.target.value as string[] })}
                        input={<OutlinedInput />}
                        renderValue={(selected) => {
                            if (selected.length === 0) return <em>활동 유형 선택</em>;
                            return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={ActionType[value as keyof typeof ActionType]} size="small" />
                                ))}
                            </Box>;
                        }}
                        sx={{ minWidth: '220px', flexGrow: 1 }}
                    >
                        {Object.entries(ActionType).map(([key, value]) => (
                            <MenuItem key={key} value={key}>
                                <Checkbox checked={filters.actionTypes.indexOf(key) > -1} />
                                <ListItemText primary={value} />
                            </MenuItem>
                        ))}
                    </Select>
                    <DatePicker
                        label="시작일"
                        value={filters.startDate}
                        onChange={(date) => setFilters({ ...filters, startDate: date })}
                    />
                    <DatePicker
                        label="종료일"
                        value={filters.endDate}
                        onChange={(date) => setFilters({ ...filters, endDate: date })}
                    />
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        <Button variant="contained" onClick={handleSearch}>검색</Button>
                        <Button variant="outlined" onClick={handleReset}>초기화</Button>
                    </Box>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>수행자</TableCell>
                            <TableCell>활동 내용</TableCell>
                            <TableCell>대상 ID</TableCell>
                            <TableCell sx={{ minWidth: 300 }}>상세 정보</TableCell>
                            <TableCell>발생 시간</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log: LogAdmin) => (
                            <TableRow key={log.id} hover>
                                <TableCell>{log.id}</TableCell>
                                <TableCell>{log.actorName}</TableCell>
                                <TableCell>
                                    <Chip label={log.actionDescription} color={getChipColor(log.actionType)} size="small" />
                                </TableCell>
                                <TableCell>{log.targetId || '-'}</TableCell>
                                <TableCell>{log.details || '-'}</TableCell>
                                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 15, 25, 50, 100]}
                    component="div"
                    count={logPagination?.totalElements ?? 0}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>
        </LocalizationProvider>
    );
};

export default LogPage;
