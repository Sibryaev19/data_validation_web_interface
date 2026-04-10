import random

col_names = {
    'row_id': 'row_id',
    "km_number": 'km_number',
    'act_sub_number': '№ подпункта акта',
    'event_type': 'Отклонение / проблема',
    'has_metric_uva': 'Последствие выражено в метриках УВА',
    'is_realized': 'Учтено в реализации',
    'neg_finder_tb': 'Центральный аппарат (далее - ЦА)/ТБ УВА, выявившее отклонение / проблему',
    'neg_finder_branch': 'Отдел УВА, выявившее отклонение / проблему',
    'process_code': 'Код процесса',
    'product_name': 'Продукт/ Услуга',
    'epk_id': 'Единый профиль клиента (ЕПК_ID)',
    'operation_date': 'Дата операции',
    'operation_sum': 'Сумма операции',
    'operation_id': 'ID-операции',
    'channel': 'Канал операции',
    'operation_tb': 'ТБ/ЦА/Подразделение центрального подчинения (далее - ПЦП) операции (отклонения / проблемы)',
    'gosb_operation': 'ГОСБ/подразделение ЦА/название ПЦП операции (отклонения / проблемы)',
    'vsp_operation': 'ВСП операции (отклонения / проблемы)',
    'profile_div_tb': 'Подразделение, ответственное за причину проблемы/отклонения/отклонения с признаками операционного риска: ЦА/ПЦП/наименование ТБ',
    'profile_div_gosb': 'Подразделение, ответственное за причину проблемы/отклонения/отклонения с признаками операционного риска: наименование Блока ЦА, наименование ПЦП или ГОСБ',
    'innul': 'Индивидуальный налоговый номер (далее - ИНН) для корпоративных клиентов',
    'isu_id': 'Идентификатор нарушения (ИСУ)',
    'tab_number': 'Табельный номер ответственного сотрудника (если применимо)',
    'isu_mkr': 'Мера МКР',
    'has_disagree': 'Есть возражения - да/нет',
    'isu_violation_amount': 'Сумма нарушения в руб',
    'profile_div': 'Проверяемое подразделение',
    'metric_fr': 'Метрика Финансового результата',
    'fr_sum': 'Сумма финансовых последствий для Банка, руб',
    'metric_cs': 'Метрика Клиентского сервиса',
    'missing_fin_summ': 'Сумма финансовых потерь Клиента/Банка, руб обязательна для метрик 101/601',
    'risk_type': 'Тип отклонения с признаками ОР_уровень 2 (код, наименование) (выбор из списка)',
    'ior_summ': 'Общая оценка суммы события, руб (сумма всех выявленных финансовых последствий по отклонениям с признаками ОР)',
    'direct_losses_summ': 'Прямые потери, руб',
    'potential_losses_summ': 'Потенциальные потери, руб',
    'indirect_losses_summ': 'Косвенные потери, руб (например, банком недополучена предусмотренная тарифами/ условиями продукта комиссия/ неустойка/ проценты)',
    'missing_client': 'Потери (в том числе хищение) средств клиентов, контрагентов, работников и третьих лиц, которые не были компенсированы Банком, руб',
    'count_client_with_theft': 'Количество клиентов, у которых похищены средства, шт (кол-во либо ноль)',
    'fict_sales_count': 'Количество фактов фиктивных продаж, фальсификаций результатов работы, мисселинга, шт (кол-во либо ноль)',
    'cred_risk_consequences': 'Последствия от отклонения с признаками ОР связаны с кредитным риском (да/нет)',
    'reg_risk_flag': 'При наличии регуляторного риска проставляется - да (признак наличия)',
    'filename': 'filename',
    'load_date': 'load_date'
}


def generate_km(km_number):
    test_mult = 100
    data = []
    for i1 in range(3):
        for i2 in range(5):
            for i3 in range(2):
                x = ((i1 * 5 + i2) * 2 + i3) * test_mult
                for rows in range(test_mult):
                    row = [str(x + rows), km_number, f"{i1}.{i2}.{i3}"] + [f"{col}_{x + rows}" for col in
                                                                           list(col_names.keys())[3:]]
                    data.append(row)
    return data, list(col_names.keys())


def generate_bin_mask(df):
    bin_mask = []
    for i in range(len(df)):
        row = []
        for j in range(len(df[i])):
            if j % 2 == 1:
                row.append(random.random() > 0.1)
            else:
                row.append(True)
        bin_mask.append(row)
    return bin_mask


def generate_km_info():
    km_info = []
    for i in range(10):
        row = {"km_name": f"99_00{i}",
               "row_count": str(100 * (i + 1) ** 3),
               "status": True if i % 2 == 0 else False}
        km_info.append(row)
    return km_info


def load_data(km_number):
    km_data, columns = generate_km(km_number)
    columns = list(col_names.values())
    bin_mask = generate_bin_mask(km_data)
    return km_data, bin_mask, columns


def get_km_info():
    km_info = generate_km_info()
    return km_info
